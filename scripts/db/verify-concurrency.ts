import "./env"
import { randomUUID } from "node:crypto"
import assert from "node:assert/strict"
import { sql } from "drizzle-orm"
import { connectDatabase } from "../../lib/db/connection"
import { saveOrder } from "../../lib/server/orders"
import { shippingMinor } from "../../lib/server/order-input"
const { client, db } = connectDatabase(process.env.MIGRATION_DATABASE_URL || "")
const productId = `test-${randomUUID()}`
const variantId = `test-${randomUUID()}`
try {
  await client.begin(async (tx) => {
    const [category] =
      await tx`select id from commerce.categories order by position limit 1`
    await tx`insert into commerce.products (id,slug,name,description,category_id,active) values (${productId},${productId},'Synthetic stock race test','Disposable concurrency fixture',${category.id},true)`
    await tx`insert into commerce.product_variants (id,product_id,sku,name,price_minor,position) values (${variantId},${productId},${variantId},'Test only',100,0)`
    await tx`insert into commerce.inventory (variant_id,quantity,verified) values (${variantId},1,true)`
  })
  const input = {
    saveAddress: false,
    items: [{ variantId, quantity: 1 }],
    expectedTotalMinor: 100 + shippingMinor(100),
    customer: {
      name: "Synthetic race test",
      email: `${productId}@example.invalid`,
      phone: "9999999999",
    },
    address: {
      line1: "Synthetic test street",
      line2: "",
      city: "Indore",
      state: "MP",
      postalCode: "452001",
      country: "IN" as const,
    },
  }
  const outcomes = await Promise.allSettled(
    [1, 2].map((n) =>
      db.transaction(async (tx) => {
        await tx.execute(sql`set local role crownhouse_app`)
        return saveOrder(
          tx,
          { ...input, idempotencyKey: randomUUID() },
          "cod",
          `synthetic-race-${n}`
        )
      })
    )
  )
  assert.equal(outcomes.filter((o) => o.status === "fulfilled").length, 1)
  assert.equal(outcomes.filter((o) => o.status === "rejected").length, 1)
  const [stock] =
    await client`select quantity from commerce.inventory where variant_id=${variantId}`
  assert.equal(stock.quantity, 0)
  console.log(
    "Verified: two simultaneous purchases of the last unit produce one order and one stock rejection; inventory never becomes negative."
  )
} catch {
  console.error("Concurrency verification failed.")
  process.exitCode = 1
} finally {
  try {
    await client.begin(async (tx) => {
      const fixtureOrders =
        await tx`select distinct o.id,o.customer_id from commerce.orders o join commerce.order_items i on i.order_id=o.id where i.variant_id=${variantId}`
      for (const order of fixtureOrders) {
        await tx`delete from commerce.notification_jobs where order_id=${order.id}`
        await tx`delete from commerce.inventory_adjustments where order_id=${order.id}`
        await tx`delete from commerce.order_addresses where order_id=${order.id}`
        await tx`delete from commerce.order_items where order_id=${order.id}`
        await tx`delete from commerce.orders where id=${order.id}`
        await tx`delete from commerce.customers where id=${order.customer_id}`
      }
      await tx`delete from commerce.inventory where variant_id=${variantId}`
      await tx`delete from commerce.product_variants where id=${variantId} and product_id=${productId}`
      await tx`delete from commerce.products where id=${productId}`
    })
    console.log(
      "Disposable test fixtures removed; imported catalog and stock untouched."
    )
  } catch {
    console.error(`Test cleanup requires review for fixture ${productId}.`)
    process.exitCode = 1
  }
  await client.end()
}
