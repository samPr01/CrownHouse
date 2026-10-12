"use server"
import { revalidatePath } from "next/cache"
import { eq, and, sql } from "drizzle-orm"
import { z } from "zod"
import { requireCustomer } from "@/lib/server/account"
import { withDatabase } from "@/lib/db/client"
import { customers, orders, returnRequests } from "@/lib/db/schema"
import { transitionOrder } from "@/lib/server/fulfilment"
import type { FormResult } from "@/components/action-form"
export async function cancelOwnOrder(
  _state: FormResult,
  form: FormData
): Promise<FormResult> {
  const user = await requireCustomer()
  try {
    const id = z.uuid().parse(form.get("id"))
    await withDatabase(async (tx) => {
      const [owned] = await tx
        .select({ id: orders.id })
        .from(orders)
        .innerJoin(customers, eq(customers.id, orders.customerId))
        .where(and(eq(orders.id, id), eq(customers.authUserId, user.id)))
      if (!owned) throw new Error("Not found")
      await transitionOrder(tx, user.id, id, "cancelled")
    })
    revalidatePath("/account")
    revalidatePath("/admin")
    return { message: "Order cancelled. Stock has been restored." }
  } catch {
    return {
      error:
        "Unable to cancel. Only unshipped, unpaid orders can be cancelled. Contact the store for help.",
    }
  }
}
export async function requestOwnReturn(
  _state: FormResult,
  form: FormData
): Promise<FormResult> {
  const user = await requireCustomer()
  try {
    const id = z.uuid().parse(form.get("id"))
    const reason = z.string().trim().min(10).max(2000).parse(form.get("reason"))
    await withDatabase(async (tx) => {
      await tx.execute(
        sql`select pg_advisory_xact_lock(hashtextextended(${id}, 1))`
      )
      const [owned] = await tx
        .select({ order: orders })
        .from(orders)
        .innerJoin(customers, eq(customers.id, orders.customerId))
        .where(and(eq(orders.id, id), eq(customers.authUserId, user.id)))
      if (!owned || owned.order.status !== "delivered")
        throw new Error("Not eligible")
      await tx
        .insert(returnRequests)
        .values({ orderId: id, reason })
        .onConflictDoNothing({ target: returnRequests.orderId })
    })
    revalidatePath("/account")
    revalidatePath("/admin")
    return {
      message:
        "Return request saved for store review. Do not send items back until the store approves.",
    }
  } catch {
    return {
      error:
        "Unable to request a return. Contact the store with your order reference.",
    }
  }
}
