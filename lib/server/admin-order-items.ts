import "server-only"
import { and, eq, inArray } from "drizzle-orm"
import { withDatabase } from "@/lib/db/client"
import { images, orderItems, variants } from "@/lib/db/schema"

type Transaction = Parameters<Parameters<typeof withDatabase>[0]>[0]

// Call only after requireAdmin. Keep purchased names/prices from the order snapshot.
export async function loadAdminOrderItems(tx: Transaction, orderIds: string[]) {
  if (!orderIds.length) return []
  return tx
    .select({ item: orderItems, image: images.url })
    .from(orderItems)
    .leftJoin(variants, eq(orderItems.variantId, variants.id))
    .leftJoin(
      images,
      and(eq(images.productId, variants.productId), eq(images.position, 0))
    )
    .where(inArray(orderItems.orderId, orderIds))
    .orderBy(orderItems.id)
}
