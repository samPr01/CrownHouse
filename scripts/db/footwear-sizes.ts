import "./env"
import { createHash } from "node:crypto"
import { and, asc, eq, inArray } from "drizzle-orm"
import { connectDatabase } from "../../lib/db/connection"
import {
  categories,
  products,
  variants,
  inventory,
  inventoryAdjustments,
  adminAuditLogs,
} from "../../lib/db/schema"

const { client, db } = connectDatabase(process.env.MIGRATION_DATABASE_URL || "")
const action = "footwear_uk_5_to_10_v1"
try {
  await db.transaction(async (tx) => {
    // Serialize this one-time catalog correction and concurrent stock changes.
    const { sql } = await import("drizzle-orm")
    await tx.execute(sql`select pg_advisory_xact_lock(564510)`)
    if (
      (
        await tx
          .select()
          .from(adminAuditLogs)
          .where(eq(adminAuditLogs.action, action))
          .limit(1)
      ).length
    ) {
      console.log("Footwear UK sizes already configured; stock unchanged.")
      return
    }
    const footwear = await tx
      .select({ product: products })
      .from(products)
      .innerJoin(categories, eq(products.categoryId, categories.id))
      .where(eq(categories.department, "Footwear"))
      .orderBy(asc(products.id))
    let totalUnits = 0
    for (const { product } of footwear) {
      const current = await tx
        .select({ variant: variants, stock: inventory })
        .from(variants)
        .innerJoin(inventory, eq(inventory.variantId, variants.id))
        .where(
          and(eq(variants.productId, product.id), eq(variants.active, true))
        )
        .orderBy(asc(variants.id))
        .for("update")
      if (!current.length) throw new Error("Footwear has no active inventory")
      const base = current[0].variant
      if (
        current.some(
          ({ variant: v }) =>
            v.priceMinor !== base.priceMinor ||
            v.compareAtMinor !== base.compareAtMinor ||
            v.currency !== base.currency
        )
      )
        throw new Error("Different footwear prices need manual review")
      const ids = current.map(({ variant }) => variant.id)
      const quantity = current.reduce(
        (total, row) => total + row.stock.quantity,
        0
      )
      const verified = current.every((row) => row.stock.verified)
      // Retain old variants and order references without changing historical sizes.
      await tx
        .update(variants)
        .set({ active: false })
        .where(inArray(variants.id, ids))
      await tx
        .update(inventory)
        .set({ quantity: 0 })
        .where(inArray(inventory.variantId, ids))
      for (const row of current) {
        if (row.stock.quantity)
          await tx.insert(inventoryAdjustments).values({
            variantId: row.variant.id,
            delta: -row.stock.quantity,
            reason: "Transfer to UK 5–10 footwear sizing",
          })
      }
      for (let index = 0; index < 6; index++) {
        const size = index + 5
        const id = `${product.id}-uk-${size}`
        const count = Math.floor(quantity / 6) + (index < quantity % 6 ? 1 : 0)
        if (
          (await tx.select().from(variants).where(eq(variants.id, id)).limit(1))
            .length
        )
          throw new Error("UK variants already exist without audit marker")
        await tx.insert(variants).values({
          id,
          productId: product.id,
          sku: `CH-${createHash("sha256").update(id).digest("hex").slice(0, 20).toUpperCase()}`,
          name: `UK ${size}`,
          options: { Size: `UK ${size}` },
          priceMinor: base.priceMinor,
          compareAtMinor: base.compareAtMinor,
          currency: base.currency,
          position: index,
          active: true,
        })
        await tx
          .insert(inventory)
          .values({ variantId: id, quantity: count, verified })
        if (count)
          await tx.insert(inventoryAdjustments).values({
            variantId: id,
            delta: count,
            reason:
              "Transfer from previous footwear sizing; total stock preserved",
          })
      }
      totalUnits += quantity
    }
    await tx.insert(adminAuditLogs).values({
      action,
      entityId: "footwear",
      changes: {
        products: footwear.length,
        totalUnits,
        sizes: [5, 6, 7, 8, 9, 10],
        system: "UK",
        distribution:
          "Existing available stock evenly distributed; historical variants archived",
      },
    })
    console.log(
      JSON.stringify({
        products: footwear.length,
        activeVariants: footwear.length * 6,
        preservedStock: totalUnits,
      })
    )
  })
} catch (error) {
  const failure = error as {
    code?: string
    cause?: { code?: string; constraint_name?: string }
  }
  console.error(
    "Database error code:",
    failure.cause?.code || failure.code || "unknown",
    failure.cause?.constraint_name || ""
  )
  console.error(
    "Footwear update failed:",
    error instanceof Error && !("query" in error)
      ? error.message
      : "database operation failed"
  )
  process.exitCode = 1
} finally {
  await client.end()
}
