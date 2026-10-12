import "./env"
import assert from "node:assert/strict"
import { randomUUID } from "node:crypto"
import { eq, sql } from "drizzle-orm"
import { connectDatabase } from "../../lib/db/connection"
import { inventory, variants, orderItems, orderAddresses, notificationJobs } from "../../lib/db/schema"
import { saveOrder } from "../../lib/server/orders"
import { shippingMinor } from "../../lib/server/order-input"
const {client,db}=connectDatabase(process.env.MIGRATION_DATABASE_URL || "")
const rollback = new Error("intentional test rollback")
try {
  const [counts]=await client`select (select count(*)::int from commerce.products) products, (select count(*)::int from commerce.product_variants) variants, (select sum(quantity)::int from commerce.inventory) units`
  assert.equal(counts.products,141);assert.equal(counts.variants,460);assert.equal(counts.units,3525)
  const distribution=await client`select p.id, sum(i.quantity)::int units from commerce.products p join commerce.product_variants v on v.product_id=p.id join commerce.inventory i on i.variant_id=v.id group by p.id having sum(i.quantity) <> 25`
  assert.equal(distribution.length,0)
  const unsafe=await client`select tablename from pg_tables where schemaname='commerce' and not rowsecurity`
  assert.equal(unsafe.length,0)
  const [access]=await client`select has_schema_privilege('anon','commerce','usage') anonymous, has_schema_privilege('authenticated','commerce','usage') authenticated`
  assert.equal(access.anonymous,false);assert.equal(access.authenticated,false)
  console.log("Verified: 141 products, 460 variants, 25 units per product (3,525 total), RLS and private schema permissions.")
  try {
    await db.transaction(async tx=>{
      await tx.execute(sql`set local role crownhouse_app`)
      const [variant]=await tx.select().from(variants).limit(1)
      const [before]=await tx.select().from(inventory).where(eq(inventory.variantId,variant.id))
      const input={saveAddress:false,idempotencyKey:randomUUID(),items:[{variantId:variant.id,quantity:1}],expectedTotalMinor:variant.priceMinor+shippingMinor(variant.priceMinor),
        customer:{name:"Integration Test",email:"test@example.invalid",phone:"9999999999"},
        address:{line1:"Synthetic test address",line2:"",city:"Indore",state:"MP",postalCode:"452001",country:"IN" as const}}
      await assert.rejects(()=>saveOrder(tx,{...input,expectedTotalMinor:1},"cod","price-test"),/Prices have changed/)
      const order=await saveOrder(tx,input,"cod","same-request")
      const repeated=await saveOrder(tx,input,"cod","same-request")
      assert.equal(order.id,repeated.id)
      await assert.rejects(()=>saveOrder(tx,input,"cod","changed-request"),/another order/)
      const [after]=await tx.select().from(inventory).where(eq(inventory.variantId,variant.id))
      assert.equal(after.quantity,before.quantity-1)
      assert.equal((await tx.select().from(orderItems).where(eq(orderItems.orderId,order.id))).length,1)
      assert.equal((await tx.select().from(orderAddresses).where(eq(orderAddresses.orderId,order.id))).length,1)
      assert.equal((await tx.select().from(notificationJobs).where(eq(notificationJobs.orderId,order.id))).length,2)
      const [job]=await tx.select().from(notificationJobs).where(eq(notificationJobs.orderId,order.id)).limit(1).for("update",{skipLocked:true})
      await tx.update(notificationJobs).set({status:"accepted",attempts:1,firstAttemptAt:new Date(),sentAt:new Date(),providerReference:"mock-provider-id"}).where(eq(notificationJobs.id,job.id))
      const [updatedJob]=await tx.select().from(notificationJobs).where(eq(notificationJobs.id,job.id))
      assert.equal(updatedJob.providerReference,"mock-provider-id")
      await tx.update(inventory).set({quantity:0}).where(eq(inventory.variantId,variant.id))
      await assert.rejects(()=>saveOrder(tx,{...input,idempotencyKey:randomUUID()},"cod","sold-out"),/Stock is not confirmed/)
      throw rollback
    })
  } catch(error) {if(error!==rollback) throw error}
  const [remaining]=await client`select count(*)::int count from commerce.customers where email='test@example.invalid'`
  assert.equal(remaining.count,0)
  console.log("Verified: transactional order writes, price validation, idempotency, stock reduction, sold-out rejection and rollback. No test customer or order persisted.")
} catch(error) {
  console.error("Verification failed:",error instanceof assert.AssertionError ? "assertion failed; inspect the named verification stage" : (error as {cause?:{code?:string};code?:string}).cause?.code || (error as {code?:string}).code || "database test failure")
  process.exitCode=1
} finally {await client.end()}
