import "server-only"
import { eq, sql } from "drizzle-orm"
import { z } from "zod"
import {
  orders,
  orderItems,
  inventory,
  inventoryAdjustments,
  adminAuditLogs,
  shipments,
  returnRequests,
} from "../db/schema"
import type { withDatabase } from "../db/client"
import { canTransition, orderStatuses } from "../fulfilment"
type Tx = Parameters<Parameters<typeof withDatabase>[0]>[0]
export const shipmentInput = z.object({
  carrier: z.string().trim().min(2).max(100),
  trackingNumber: z.string().trim().min(2).max(150),
  trackingUrl: z
    .url()
    .max(1000)
    .refine(
      (v) => new URL(v).protocol === "https:",
      "Tracking URL must use HTTPS."
    ),
})
async function restoreStock(tx: Tx, orderId: string, reason: string) {
  const lines = await tx
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, orderId))
    .orderBy(orderItems.variantId)
  for (const line of lines) {
    const changed = await tx
      .update(inventory)
      .set({ quantity: sql`${inventory.quantity}+${line.quantity}` })
      .where(eq(inventory.variantId, line.variantId))
      .returning()
    if (changed.length !== 1)
      throw new Error("Inventory record missing; stock restoration aborted.")
    await tx
      .insert(inventoryAdjustments)
      .values({
        variantId: line.variantId,
        orderId,
        delta: line.quantity,
        reason,
      })
  }
}
// Only the authenticated admin wrapper may call these transaction helpers.
export async function transitionOrder(
  tx: Tx,
  actorId: string,
  id: string,
  status: string,
  tracking?: unknown
) {
  z.uuid().parse(id)
  z.enum(orderStatuses).parse(status)
  const [order] = await tx
    .select()
    .from(orders)
    .where(eq(orders.id, id))
    .for("update")
  if (!order || !canTransition(order.status, status))
    throw new Error("This order status change is not allowed.")
  if (order.status === status) return
  if (status === "shipped") {
    const data = shipmentInput.parse(tracking)
    await tx
      .insert(shipments)
      .values({ orderId: id, ...data })
      .onConflictDoUpdate({
        target: shipments.orderId,
        set: { ...data, updatedAt: new Date() },
      })
  }
  if (status === "cancelled") {
    if (order.paymentStatus !== "unpaid")
      throw new Error("Paid orders require a separate refund review.")
    if (order.paymentMethod === "cod")
      await restoreStock(tx, id, "order cancelled")
  }
  await tx.update(orders).set({ status }).where(eq(orders.id, id))
  await tx
    .insert(adminAuditLogs)
    .values({
      actorId,
      action: "order.status",
      entityId: id,
      changes: { from: order.status, to: status },
    })
}
export async function collectCod(tx: Tx, actorId: string, id: string) {
  z.uuid().parse(id)
  const [order] = await tx
    .select()
    .from(orders)
    .where(eq(orders.id, id))
    .for("update")
  if (!order || order.paymentMethod !== "cod" || order.status !== "delivered")
    throw new Error(
      "COD collection can only be recorded for delivered COD orders."
    )
  if (order.paymentStatus === "paid") return
  const [returned] = await tx.select().from(returnRequests).where(eq(returnRequests.orderId,id))
  if(returned?.status==="closed") throw new Error("This return is closed; payment needs manual review.")
  if (order.paymentStatus !== "unpaid")
    throw new Error("Payment state requires review.")
  await tx
    .update(orders)
    .set({ paymentStatus: "paid" })
    .where(eq(orders.id, id))
  await tx
    .insert(adminAuditLogs)
    .values({
      actorId,
      action: "cod.collected",
      entityId: id,
      changes: { from: "unpaid", to: "paid", amountMinor: order.totalMinor },
    })
}
export async function processReturn(
  tx: Tx,
  actorId: string,
  id: string,
  status: string,
  note: string
) {
  z.uuid().parse(id)
  z.enum(["approved", "rejected", "received", "closed"]).parse(status)
  z.string().trim().min(3).max(2000).parse(note)
  const [request] = await tx
    .select()
    .from(returnRequests)
    .where(eq(returnRequests.id, id))
    .for("update")
  if (!request) throw new Error("Return request not found.")
  if (request.status === status) return
  const allowed: Record<string, string[]> = {
    requested: ["approved", "rejected"],
    approved: ["received"],
    received: ["closed"],
    rejected: [],
    closed: [],
  }
  if (!allowed[request.status]?.includes(status))
    throw new Error("Return status change not allowed.")
  const [order] = await tx
    .select()
    .from(orders)
    .where(eq(orders.id, request.orderId))
    .for("update")
  if (!order || order.status !== "delivered")
    throw new Error("Only delivered orders can be returned.")
  if (status === "received" && order.paymentMethod === "cod")
    await restoreStock(tx, order.id, "return received and inspected")
  if (status === "closed" && order.paymentStatus === "paid")
    await tx
      .update(orders)
      .set({ paymentStatus: "refunded" })
      .where(eq(orders.id, order.id))
  await tx
    .update(returnRequests)
    .set({ status, note: note.trim() })
    .where(eq(returnRequests.id, id))
  await tx
    .insert(adminAuditLogs)
    .values({
      actorId,
      action: "return.status",
      entityId: id,
      changes: { from: request.status, to: status, note: note.trim() },
    })
}
