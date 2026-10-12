"use server"
import { randomUUID } from "node:crypto"
import { revalidatePath } from "next/cache"
import { eq, and } from "drizzle-orm"
import { z } from "zod"
import { requireAdmin } from "@/lib/server/admin"
import { withDatabase } from "@/lib/db/client"
import {
  products,
  variants,
  inventory,
  inventoryAdjustments,
  images,
  adminAuditLogs,
  contactMessages,
} from "@/lib/db/schema"
import {
  transitionOrder,
  collectCod,
  processReturn,
} from "@/lib/server/fulfilment"
import type { FormResult } from "@/components/action-form"
const field = (form: FormData, name: string) => String(form.get(name) || "")
function resultError(error: unknown): FormResult {
  return {
    error:
      error instanceof z.ZodError
        ? "Check the required fields, prices and URLs."
        : "Unable to save. Check the current status and retry. Changes were rolled back.",
  }
}
async function run(
  work: (actor: string) => Promise<unknown>
): Promise<FormResult> {
  const actor = await requireAdmin()
  try {
    await work(actor)
    revalidatePath("/", "layout")
    return { message: "Saved successfully." }
  } catch (error) {
    console.error(
      "Admin operation failed",
      error instanceof z.ZodError
        ? "validation"
        : (error as { code?: string }).code || "operation"
    )
    return resultError(error)
  }
}
export async function orderStatus(_state: FormResult, form: FormData) {
  return run((actor) =>
    withDatabase((tx) =>
      transitionOrder(tx, actor, field(form, "id"), field(form, "status"), {
        carrier: field(form, "carrier"),
        trackingNumber: field(form, "trackingNumber"),
        trackingUrl: field(form, "trackingUrl"),
      })
    )
  )
}
export async function codCollected(_state: FormResult, form: FormData) {
  return run((actor) =>
    withDatabase((tx) => collectCod(tx, actor, field(form, "id")))
  )
}
export async function returnStatus(_state: FormResult, form: FormData) {
  return run((actor) =>
    withDatabase((tx) =>
      processReturn(
        tx,
        actor,
        field(form, "id"),
        field(form, "status"),
        field(form, "note")
      )
    )
  )
}
const productInput = z.object({
  name: z.string().trim().min(3).max(200),
  slug: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .max(200),
  description: z.string().trim().min(10).max(10000),
  categoryId: z.string().min(1).max(100),
  active: z.boolean(),
})
export async function saveProduct(_state: FormResult, form: FormData) {
  return run((actor) =>
    withDatabase(async (tx) => {
      const data = productInput.parse({
        name: field(form, "name"),
        slug: field(form, "slug"),
        description: field(form, "description"),
        categoryId: field(form, "categoryId"),
        active: form.get("active") === "on",
      })
      const id = field(form, "id") || randomUUID()
      const [before] = await tx
        .select()
        .from(products)
        .where(eq(products.id, id))
        .for("update")
      if (before && data.active) {
        const available = await tx
          .select({ id: variants.id })
          .from(variants)
          .innerJoin(inventory, eq(inventory.variantId, variants.id))
          .where(
            and(
              eq(variants.productId, id),
              eq(variants.active, true),
              eq(inventory.verified, true)
            )
          )
          .limit(1)
        const picture = await tx
          .select({ id: images.id })
          .from(images)
          .where(and(eq(images.productId, id), eq(images.position, 0)))
          .limit(1)
        if (!available.length || !picture.length)
          throw new Error(
            "Add an active verified variant and main image before publishing."
          )
      }
      if (before) await tx.update(products).set(data).where(eq(products.id, id))
      else await tx.insert(products).values({ id, ...data, active: false })
      await tx
        .insert(adminAuditLogs)
        .values({
          actorId: actor,
          action: before ? "product.update" : "product.create",
          entityId: id,
          changes: { before: before || null, after: data },
        })
    })
  )
}
export async function saveVariant(_state: FormResult, form: FormData) {
  return run((actor) =>
    withDatabase(async (tx) => {
      const input = z
        .object({
          id: z.string().max(200),
          productId: z.string().min(1).max(200),
          sku: z.string().trim().min(1).max(150),
          name: z.string().trim().min(1).max(150),
          priceMinor: z.coerce.number().int().min(1).max(100000000),
          quantity: z.coerce.number().int().min(0).max(100000),
          position: z.coerce.number().int().min(0).max(10000),
          active: z.boolean(),
          options: z.record(z.string().max(40), z.string().max(100)),
        })
        .parse({
          id: field(form, "id"),
          productId: field(form, "productId"),
          sku: field(form, "sku"),
          name: field(form, "name"),
          priceMinor: field(form, "priceMinor"),
          quantity: field(form, "quantity"),
          position: field(form, "position"),
          active: form.get("active") === "on",
          options: JSON.parse(field(form, "options") || "{}"),
        })
      const id = input.id || randomUUID()
      // Match checkout's lock order so editing stock cannot deadlock with a purchase.
      const [stock] = await tx
        .select()
        .from(inventory)
        .where(eq(inventory.variantId, id))
        .for("update")
      const [before] = await tx
        .select()
        .from(variants)
        .where(eq(variants.id, id))
        .for("update")
      if (before && before.productId !== input.productId)
        throw new Error("Variant mismatch")
      const { quantity, options, ...rest } = input
      const data = {
        ...rest,
        id,
        options,
        compareAtMinor: null,
        currency: "INR",
      }
      if (before) await tx.update(variants).set(data).where(eq(variants.id, id))
      else await tx.insert(variants).values(data)
      if (
        before &&
        Number(field(form, "expectedQuantity")) !== (stock?.quantity || 0)
      )
        throw new Error("Stock changed while editing. Reload before saving.")
      await tx
        .insert(inventory)
        .values({ variantId: id, quantity, verified: true })
        .onConflictDoUpdate({
          target: inventory.variantId,
          set: { quantity, verified: true },
        })
      const delta = quantity - (stock?.quantity || 0)
      if (delta)
        await tx
          .insert(inventoryAdjustments)
          .values({
            variantId: id,
            delta,
            reason: "admin verified stock adjustment",
          })
      await tx
        .insert(adminAuditLogs)
        .values({
          actorId: actor,
          action: "variant.update",
          entityId: id,
          changes: {
            before: before || null,
            after: data,
            previousStock: stock?.quantity || 0,
            quantity,
          },
        })
    })
  )
}
export async function saveImage(_state: FormResult, form: FormData) {
  return run((actor) =>
    withDatabase(async (tx) => {
      const data = z
        .object({
          productId: z.string().min(1).max(200),
          url: z
            .url()
            .max(2000)
            .refine((v) => new URL(v).protocol === "https:"),
          alt: z.string().trim().min(2).max(200),
          position: z.coerce.number().int().min(0).max(100),
        })
        .parse({
          productId: field(form, "productId"),
          url: field(form, "url"),
          alt: field(form, "alt"),
          position: field(form, "position"),
        })
      await tx
        .insert(images)
        .values(data)
        .onConflictDoUpdate({
          target: [images.productId, images.position],
          set: { url: data.url, alt: data.alt },
        })
      await tx
        .insert(adminAuditLogs)
        .values({
          actorId: actor,
          action: "image.update",
          entityId: data.productId,
          changes: data,
        })
    })
  )
}
export async function resolveMessage(_state: FormResult, form: FormData) {
  return run((actor) =>
    withDatabase(async (tx) => {
      const id = z.uuid().parse(field(form, "id"))
      await tx
        .update(contactMessages)
        .set({ status: "resolved" })
        .where(eq(contactMessages.id, id))
      await tx
        .insert(adminAuditLogs)
        .values({
          actorId: actor,
          action: "contact.resolved",
          entityId: id,
          changes: { status: "resolved" },
        })
    })
  )
}
