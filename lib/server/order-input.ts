import { z } from "zod"

export const cartInput = z.array(z.object({
  variantId: z.string().min(1).max(200), quantity: z.number().int().min(1).max(10),
}).strict()).min(1).max(50).transform(items => {
  const quantities = new Map<string, number>()
  for (const item of items) quantities.set(item.variantId, (quantities.get(item.variantId) || 0) + item.quantity)
  return [...quantities].sort(([a], [b]) => a.localeCompare(b)).map(([variantId, quantity]) => ({variantId, quantity}))
}).refine(items => items.every(i => i.quantity <= 10), "Maximum ten per variant")

export const orderInput = z.object({
  idempotencyKey: z.uuid(),
  items: cartInput,
  saveAddress: z.boolean().default(false),
  expectedTotalMinor: z.number().int().positive(),
  customer: z.object({
    name: z.string().trim().min(2).max(120), email: z.email().max(254).transform(s => s.toLowerCase()),
    phone: z.string().trim().regex(/^\+?[0-9]{10,15}$/),
  }).strict(),
  address: z.object({
    line1: z.string().trim().min(5).max(200), line2: z.string().trim().max(200).default(""),
    city: z.string().trim().min(2).max(100), state: z.string().trim().min(2).max(100),
    postalCode: z.string().regex(/^[1-9][0-9]{5}$/), country: z.literal("IN"),
  }).strict(),
}).strict()

export function checkoutMode() {
  const mode = process.env.CHECKOUT_MODE
  if (mode === "cod") return "cod"
  if (mode === "demo" && process.env.APP_ENV === "development") return "demo"
  return "disabled"
}

export function shippingMinor(subtotal: number) { return subtotal >= 59900 ? 0 : 9900 }
