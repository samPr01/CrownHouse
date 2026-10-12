import "server-only"
import { redirect } from "next/navigation"
import { and, desc, eq, inArray, sql } from "drizzle-orm"
import { getCurrentUser } from "../supabase/server"
import { withDatabase } from "../db/client"
import { readCustomerOrder,changeCustomerAddress,deleteCustomerAddress } from "./account-records"
import { ensureCustomer } from "./customer-record"
import { addresses, customers, orders, orderItems, orderAddresses } from "../db/schema"
import { addressInput, profileInput } from "../auth-validation"

export async function requireCustomer() {
  const user=await getCurrentUser()
  if(!user) redirect("/login")
  return {id:user.id,email:user.email!,name:typeof user.user_metadata?.full_name==="string"?user.user_metadata.full_name:undefined}
}
export async function accountDetails() {
  const identity=await requireCustomer()
  return withDatabase(async tx=>{
    const customer=await ensureCustomer(tx,identity)
    const saved=await tx.select().from(addresses).where(eq(addresses.customerId,customer.id)).orderBy(desc(addresses.createdAt)).limit(10)
    return {name:customer.name,email:identity.email,phone:customer.phone,addresses:saved.map(a=>({id:a.id,...addressInput.parse(a.address)}))}
  })
}
export async function updateProfile(input:unknown) {
  const identity=await requireCustomer();const data=profileInput.parse(input)
  return withDatabase(async tx=>{
    await ensureCustomer(tx,identity)
    return tx.update(customers).set(data).where(eq(customers.authUserId,identity.id))
  })
}
export async function saveAddress(input:unknown,id?:string) {
  const identity=await requireCustomer();const address=addressInput.parse(input)
  return withDatabase(async tx=>{
    const customer=await ensureCustomer(tx,identity)
    await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${customer.id}, 2))`)
    if(id) await changeCustomerAddress(tx,customer.id,id,address)
    else {
      if((await tx.select({id:addresses.id}).from(addresses).where(eq(addresses.customerId,customer.id)).limit(10)).length>=10) throw new Error("You can save up to ten addresses.")
      await tx.insert(addresses).values({customerId:customer.id,address})
    }
  })
}
export async function removeAddress(id:string) {
  const identity=await requireCustomer()
  return withDatabase(async tx=>{
    const [customer]=await tx.select().from(customers).where(eq(customers.authUserId,identity.id))
    if(customer) await deleteCustomerAddress(tx,customer.id,id)
  })
}
export async function accountOrders(page=1) {
  const identity=await requireCustomer()
  return withDatabase(async tx=>{
    const [customer]=await tx.select().from(customers).where(eq(customers.authUserId,identity.id))
    if(!customer) return []
    const list=await tx.select().from(orders).where(eq(orders.customerId,customer.id)).orderBy(desc(orders.createdAt)).limit(20).offset((page-1)*20)
    if(!list.length) return []
    const items=await tx.select().from(orderItems).where(inArray(orderItems.orderId,list.map(o=>o.id)))
    return list.map(o=>({id:o.id,status:o.status,paymentStatus:o.paymentStatus,paymentMethod:o.paymentMethod,totalMinor:o.totalMinor,createdAt:o.createdAt,items:items.filter(i=>i.orderId===o.id)}))
  })
}
export async function accountOrder(id:string) {
  const identity=await requireCustomer()
  return withDatabase(tx=>readCustomerOrder(tx,identity.id,id))
}
