import "./env"
import assert from "node:assert/strict"
import {randomUUID} from "node:crypto"
import {eq,sql} from "drizzle-orm"
import {connectDatabase} from "../../lib/db/connection"
import {customers,addresses,variants,orders} from "../../lib/db/schema"
import {ensureCustomer} from "../../lib/server/customer-record"
import {readCustomerOrder,changeCustomerAddress,deleteCustomerAddress} from "../../lib/server/account-records"
import {saveOrder} from "../../lib/server/orders"
import {shippingMinor} from "../../lib/server/order-input"
const {client,db}=connectDatabase(process.env.MIGRATION_DATABASE_URL||"")
const rollback=new Error("intentional account test rollback")
try {
  try {await db.transaction(async tx=>{
    await tx.execute(sql`set local role crownhouse_app`)
    const a={id:randomUUID(),email:"account-test@example.invalid",name:"Account A"}
    const b={id:randomUUID(),email:"account-b@example.invalid",name:"Account B"}
    const [guest]=await tx.insert(customers).values({name:"Guest",email:a.email,phone:"9999999999"}).returning()
    const first=await ensureCustomer(tx,a);const repeated=await ensureCustomer(tx,a);const second=await ensureCustomer(tx,b)
    assert.equal(first.id,repeated.id);assert.notEqual(first.id,guest.id)
    const address={line1:"Synthetic street 123",line2:"",city:"Indore",state:"MP",postalCode:"452001",country:"IN" as const}
    const [saved]=await tx.insert(addresses).values({customerId:first.id,address}).returning()
    assert.equal((await changeCustomerAddress(tx,second.id,saved.id,{...address,city:"Other city"})).length,0)
    assert.equal((await deleteCustomerAddress(tx,second.id,saved.id)).length,0)
    assert.equal((await changeCustomerAddress(tx,first.id,saved.id,{...address,city:"Updated city"})).length,1)
    const [variant]=await tx.select().from(variants).limit(1)
    const input={saveAddress:true,idempotencyKey:randomUUID(),items:[{variantId:variant.id,quantity:1}],expectedTotalMinor:variant.priceMinor+shippingMinor(variant.priceMinor),
      customer:{name:"Original Recipient",email:a.email,phone:"9999999999"},address}
    const order=await saveOrder(tx,input,"cod","account-request",a)
    assert.ok(await readCustomerOrder(tx,a.id,order.id))
    assert.equal(await readCustomerOrder(tx,b.id,order.id),null)
    const [record]=await tx.select().from(orders).where(eq(orders.id,order.id));assert.equal(record.customerId,first.id)
    await tx.update(customers).set({name:"Changed Profile"}).where(eq(customers.id,first.id))
    const snapshot=await readCustomerOrder(tx,a.id,order.id);assert.equal(snapshot?.order.customerDetails?.name,"Original Recipient")
    assert.equal(snapshot?.address.city,"Indore")
    const guestOrder=await saveOrder(tx,{...input,saveAddress:false,idempotencyKey:randomUUID()},"cod","guest-request")
    assert.equal(await readCustomerOrder(tx,a.id,guestOrder.id),null)
    assert.equal((await deleteCustomerAddress(tx,first.id,saved.id)).length,1)
    throw rollback
  })} catch(error) {if(error!==rollback) throw error}
  const [remaining]=await client`select count(*)::int count from commerce.customers where email in ('account-test@example.invalid','account-b@example.invalid')`
  assert.equal(remaining.count,0)
  console.log("Verified: profile uniqueness, no guest-email linking, account order ownership, address ownership, immutable order snapshots and rollback. No test records persisted.")
} catch(error) {console.error("Account verification failed:",(error as {cause?:{code?:string};code?:string}).cause?.code||(error as {code?:string}).code||"assertion/database error");process.exitCode=1}
finally {await client.end()}
