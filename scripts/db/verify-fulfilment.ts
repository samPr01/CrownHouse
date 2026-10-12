import "./env"
import assert from "node:assert/strict"
import { randomUUID } from "node:crypto"
import { eq, sql } from "drizzle-orm"
import { connectDatabase } from "../../lib/db/connection"
import {
  customers,
  variants,
  inventory,
  orders,
  returnRequests,
  shipments,
  contactMessages,
} from "../../lib/db/schema"
import { saveOrder } from "../../lib/server/orders"
import {
  transitionOrder,
  collectCod,
  processReturn,
} from "../../lib/server/fulfilment"
import { shippingMinor } from "../../lib/server/order-input"
const { client, db } = connectDatabase(process.env.MIGRATION_DATABASE_URL || "")
const rollback = new Error("intentional rollback")
try {
  try {
    await db.transaction(async (tx) => {
      await tx.execute(sql`set local role crownhouse_app`)
      const actor = randomUUID()
      const [variant] = await tx.select().from(variants).limit(1)
      const stock = async () =>
        Number(
          (
            await tx
              .select()
              .from(inventory)
              .where(eq(inventory.variantId, variant.id))
          )[0].quantity
        )
      const before = await stock()
      assert.ok(before >= 2)
      const input = {
        saveAddress: false,
        idempotencyKey: randomUUID(),
        items: [{ variantId: variant.id, quantity: 1 }],
        expectedTotalMinor:
          variant.priceMinor + shippingMinor(variant.priceMinor),
        customer: {
          name: "Synthetic Fulfilment",
          email: "fulfilment@example.invalid",
          phone: "9999999999",
        },
        address: {
          line1: "Synthetic street 123",
          line2: "",
          city: "Indore",
          state: "MP",
          postalCode: "452001",
          country: "IN" as const,
        },
      }
      const cancelled = await saveOrder(tx, input, "cod", "synthetic-cancel")
      assert.equal(await stock(), before - 1)
      await transitionOrder(tx, actor, cancelled.id, "cancelled")
      await transitionOrder(tx, actor, cancelled.id, "cancelled")
      assert.equal(await stock(), before)
      await assert.rejects(() =>
        transitionOrder(tx, actor, cancelled.id, "processing")
      )
      const delivered = await saveOrder(
        tx,
        { ...input, idempotencyKey: randomUUID() },
        "cod",
        "synthetic-delivery"
      )
      await assert.rejects(() =>
        transitionOrder(tx, actor, delivered.id, "delivered")
      )
      await assert.rejects(() => collectCod(tx, actor, delivered.id))
      await transitionOrder(tx, actor, delivered.id, "processing")
      await assert.rejects(() =>
        transitionOrder(tx, actor, delivered.id, "shipped", {
          carrier: "Test",
          trackingNumber: "123",
          trackingUrl: "javascript:alert(1)",
        })
      )
      await transitionOrder(tx, actor, delivered.id, "shipped", {
        carrier: "Test carrier",
        trackingNumber: "TEST123",
        trackingUrl: "https://example.invalid/track/TEST123",
      })
      assert.equal(
        (
          await tx
            .select()
            .from(shipments)
            .where(eq(shipments.orderId, delivered.id))
        ).length,
        1
      )
      await assert.rejects(() =>
        transitionOrder(tx, actor, delivered.id, "cancelled")
      )
      await transitionOrder(tx, actor, delivered.id, "delivered")
      await collectCod(tx, actor, delivered.id)
      await collectCod(tx, actor, delivered.id)
      const [request] = await tx
        .insert(returnRequests)
        .values({
          orderId: delivered.id,
          reason: "Synthetic full order return",
        })
        .returning()
      await processReturn(
        tx,
        actor,
        request.id,
        "approved",
        "Approved synthetic test"
      )
      await processReturn(
        tx,
        actor,
        request.id,
        "received",
        "Inspected all items and suitable for restock"
      )
      await processReturn(tx, actor, request.id, "received", "Repeat retry")
      assert.equal(await stock(), before)
      await processReturn(
        tx,
        actor,
        request.id,
        "closed",
        "External refund reference TEST-ONLY"
      )
      assert.equal(
        (await tx.select().from(orders).where(eq(orders.id, delivered.id)))[0]
          .paymentStatus,
        "refunded"
      )
      await tx
        .insert(contactMessages)
        .values({
          name: "Synthetic test",
          email: "test@example.invalid",
          message: "Synthetic contact persistence test",
        })
      const tables = await tx.execute(
        sql`select tablename, rowsecurity from pg_tables where schemaname='commerce'`
      )
      assert.equal(tables.length, 19)
      assert.ok(tables.every((t) => t.rowsecurity === true))
      const [privilege] = await tx.execute(
        sql`select has_schema_privilege('anon','commerce','USAGE') as anon, has_schema_privilege('authenticated','commerce','USAGE') as authenticated`
      )
      assert.equal(privilege.anon, false)
      assert.equal(privilege.authenticated, false)
      throw rollback
    })
  } catch (error) {
    if (error !== rollback) throw error
  }
  const [remaining] =
    await client`select count(*)::int count from commerce.customers where email='fulfilment@example.invalid'`
  assert.equal(remaining.count, 0)
  console.log(
    "Verified: cancellation restores stock once, status sequencing, safe tracking, COD collection, full-return restock once, refund recording, contact persistence and 19-table RLS. All test writes rolled back."
  )
} catch (error) {
  console.error(
    "Fulfilment verification failed:",
    (error as { cause?: { code?: string }; code?: string }).cause?.code ||
      (error as { code?: string }).code ||
      "assertion/database error"
  )
  process.exitCode = 1
} finally {
  await client.end()
}
