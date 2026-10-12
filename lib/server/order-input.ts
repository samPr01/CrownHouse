import { z } from "zod"

export const cartInput = z
  .array(
    z
      .object({
        variantId: z.string().min(1).max(200),
        quantity: z.number().int().min(1).max(10),
      })
      .strict()
  )
  .min(1)
  .max(50)
  .transform((items) => {
    const quantities = new Map<string, number>()
    for (const item of items)
      quantities.set(
        item.variantId,
        (quantities.get(item.variantId) || 0) + item.quantity
      )
    return [...quantities]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([variantId, quantity]) => ({ variantId, quantity }))
  })
  .refine(
    (items) => items.every((i) => i.quantity <= 10),
    "Maximum ten per variant"
  )

export const orderInput = z
  .object({
    idempotencyKey: z.uuid(),
    items: cartInput,
    saveAddress: z.boolean().default(false),
    expectedTotalMinor: z.number().int().positive(),
    customer: z
      .object({
        name: z.string().trim().min(2).max(120),
        email: z
          .email()
          .max(254)
          .transform((s) => s.toLowerCase()),
        phone: z
          .string()
          .trim()
          .regex(/^\+?[0-9]{10,15}$/),
      })
      .strict(),
    address: z
      .object({
        line1: z.string().trim().min(5).max(200),
        line2: z.string().trim().max(200).default(""),
        city: z.string().trim().min(2).max(100),
        state: z.string().trim().min(2).max(100),
        postalCode: z.string().regex(/^[1-9][0-9]{5}$/),
        country: z.literal("IN"),
      })
      .strict(),
  })
  .strict()

export function checkoutMode() {
  const mode = process.env.CHECKOUT_MODE
  if (mode === "cod") return "cod"
  if (mode === "demo" && process.env.APP_ENV === "development") return "demo"
  return "disabled"
}

export function shippingMinor(subtotal: number) {
  return subtotal >= 59900 ? 0 : 9900
}

export function checkoutValidationMessage(error: z.ZodError) {
  const messages: Record<string, string> = {
    "customer.name": "Enter your full name (2–120 characters).",
    "customer.email": "Enter a valid email address.",
    "customer.phone":
      "Enter a phone number with 10–15 digits, optionally starting with +; omit spaces and punctuation.",
    "address.line1":
      "Enter a complete street address (5–200 characters), including the building or street name.",
    "address.line2": "Keep the apartment or landmark under 200 characters.",
    "address.city": "Enter a city (2–100 characters).",
    "address.state": "Enter a state (2–100 characters).",
    "address.postalCode": "Enter a valid six-digit Indian PIN code.",
    "address.country": "Delivery is available within India only.",
    expectedTotalMinor: "Refresh checkout to reload your order total.",
    idempotencyKey: "Refresh checkout and try submitting again.",
  }
  return [
    ...new Set(
      error.issues.map((issue) => {
        const path = issue.path.join(".")
        return (
          messages[path] ||
          (issue.path[0] === "items"
            ? "Check your bag: select a product variant and a quantity between 1 and 10."
            : "Please check your checkout details.")
        )
      })
    ),
  ].join(" ")
}
