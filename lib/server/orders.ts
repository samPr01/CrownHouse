import "server-only"
import { createHash } from "node:crypto"
import { and, eq, inArray, sql } from "drizzle-orm"
import { alias } from "drizzle-orm/pg-core"
import { withDatabase } from "../db/client"
import { customers, addresses, products, variants, inventory, orders, orderItems, orderAddresses, inventoryAdjustments, notificationJobs } from "../db/schema"
import { getCurrentUser } from "../supabase/server"
import { ensureCustomer, type CustomerIdentity } from "./customer-record"
import { emailConfig } from "./email-provider"
import { cartInput, orderInput, checkoutMode, shippingMinor } from "./order-input"

export class CheckoutError extends Error {
  constructor(message: string, public status = 409) { super(message) }
}
type Tx = Parameters<Parameters<typeof withDatabase>[0]>[0]
async function quote(tx: Tx, items: {variantId:string;quantity:number}[], lock = false) {
  const stock = alias(inventory, "stock")
  const query = tx.select({ variant: variants, product: products, stock }).from(variants)
    .innerJoin(products, eq(variants.productId, products.id)).innerJoin(stock, eq(stock.variantId, variants.id))
    .where(and(inArray(variants.id, items.map(i=>i.variantId)), eq(variants.active,true), eq(products.active,true))).orderBy(variants.id)
  const rows = await (lock ? query.for("update", {of: stock}) : query)
  if (rows.length !== items.length) throw new CheckoutError("An item is no longer available. Please update your bag.")
  const lines = items.map(item => {
    const row = rows.find(r => r.variant.id === item.variantId)!
    if (checkoutMode() !== "demo" && (!row.stock.verified || row.stock.quantity < item.quantity))
      throw new CheckoutError("Stock is not confirmed for an item in your bag.")
    return {...item, name:row.product.name, sku:row.variant.sku, options:row.variant.options, unitPriceMinor:row.variant.priceMinor}
  })
  const subtotalMinor = lines.reduce((sum,l)=>sum+l.unitPriceMinor*l.quantity,0)
  const delivery = shippingMinor(subtotalMinor)
  return {lines,subtotalMinor,shippingMinor:delivery,totalMinor:subtotalMinor+delivery,currency:"INR"}
}
export async function quoteCart(input: unknown) {
  if (checkoutMode() === "disabled") throw new CheckoutError("Checkout is not open yet.",503)
  const items = cartInput.parse(input)
  return withDatabase(tx => quote(tx,items))
}
export async function createOrder(input: unknown) {
  const mode = checkoutMode()
  if (mode === "disabled") throw new CheckoutError("Checkout is not open yet.",503)
  const data = orderInput.parse(input)
  const allowedPins=(process.env.DELIVERY_PIN_CODES||"").split(",").map(v=>v.trim()).filter(Boolean)
  if(allowedPins.length && !allowedPins.includes(data.address.postalCode)) throw new CheckoutError("Delivery is not currently available for this PIN code.",400)
  const user=await getCurrentUser()
  const identity=user?{id:user.id,email:user.email!,name:data.customer.name}:undefined
  if(identity) data.customer.email=identity.email
  const hash = createHash("sha256").update(JSON.stringify({...data,mode,authUserId:identity?.id||null})).digest("hex")
  return withDatabase(tx => saveOrder(tx,data,mode,hash,identity))
}

export async function saveOrder(tx: Tx, data: ReturnType<typeof orderInput.parse>, mode: "demo" | "cod", hash: string, identity?: CustomerIdentity) {
    // Serialize retries before checking the unique key; all following writes commit together.
    await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${data.idempotencyKey}, 0))`)
    const [existing] = await tx.select().from(orders).where(eq(orders.idempotencyKey,data.idempotencyKey))
    if (existing) {
      if (existing.requestHash !== hash) throw new CheckoutError("This request key was used for another order.")
      return {id:existing.id,totalMinor:existing.totalMinor,currency:existing.currency,mode:existing.paymentMethod}
    }
    const totals = await quote(tx,data.items,true)
    if (totals.totalMinor !== data.expectedTotalMinor) throw new CheckoutError("Prices have changed. Refresh your order summary.")
    // Guest profiles are deliberately not merged by unverified email addresses.
    const customer = identity ? await ensureCustomer(tx,identity) : (await tx.insert(customers).values(data.customer).returning({id:customers.id}))[0]
    const [order] = await tx.insert(orders).values({customerId:customer.id,idempotencyKey:data.idempotencyKey,requestHash:hash,
      customerDetails:data.customer,paymentMethod:mode,subtotalMinor:totals.subtotalMinor,shippingMinor:totals.shippingMinor,totalMinor:totals.totalMinor}).returning()
    await tx.insert(orderItems).values(totals.lines.map(line=>({...line,orderId:order.id})))
    await tx.insert(orderAddresses).values({orderId:order.id,address:data.address})
    if(identity && data.saveAddress) {
      await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${customer.id}, 2))`)
      const saved=await tx.select().from(addresses).where(eq(addresses.customerId,customer.id)).limit(10)
      if(saved.length<10 && !saved.some(a=>JSON.stringify(a.address)===JSON.stringify(data.address)))
        await tx.insert(addresses).values({customerId:customer.id,address:data.address})
    }
    if (mode === "cod") for (const line of totals.lines) {
      await tx.update(inventory).set({quantity:sql`${inventory.quantity} - ${line.quantity}`}).where(eq(inventory.variantId,line.variantId))
      await tx.insert(inventoryAdjustments).values({variantId:line.variantId,orderId:order.id,delta:-line.quantity,reason:"order placed"})
    }
    await tx.insert(notificationJobs).values(["merchant_order","customer_confirmation"].map(kind=>({
      orderId:order.id,kind,status:mode==="cod"&&emailConfig()?"pending":"blocked",lastError:mode==="demo"?"Demo order; email sending disabled":emailConfig()?null:"Email delivery is not configured",
    })))
    return {id:order.id,totalMinor:order.totalMinor,currency:order.currency,mode}
}

