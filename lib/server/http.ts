import "server-only"
import { ZodError } from "zod"
import { CheckoutError } from "./orders"
import { rateLimit } from "./rate-limit"
import { checkoutValidationMessage } from "./order-input"
export async function readCheckoutRequest(request: Request) {
  const origin = process.env.APP_URL && new URL(process.env.APP_URL).origin
  if (!origin || request.headers.get("origin") !== origin)
    throw new CheckoutError("Invalid request origin.", 403)
  // Vercel overwrites this header; other deployments use a conservative shared bucket.
  const address = process.env.VERCEL
    ? request.headers.get("x-vercel-forwarded-for") || "shared"
    : "shared"
  if (!(await rateLimit("checkout", address, 60, 900)))
    throw new CheckoutError(
      "Too many checkout requests. Please try again shortly.",
      429
    )
  if (!request.headers.get("content-type")?.includes("application/json"))
    throw new CheckoutError("JSON required.", 415)
  const reader = request.body?.getReader()
  if (!reader) throw new CheckoutError("Request body required.", 400)
  const chunks: Uint8Array[] = []
  let length = 0
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    length += value.byteLength
    if (length > 32000) {
      await reader.cancel()
      throw new CheckoutError("Request too large.", 413)
    }
    chunks.push(value)
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8")) as unknown
  } catch {
    throw new CheckoutError("Invalid JSON.", 400)
  }
}
export function checkoutResponse(error: unknown) {
  if (error instanceof ZodError)
    return Response.json(
      { error: checkoutValidationMessage(error) },
      { status: 400 }
    )
  if (error instanceof CheckoutError)
    return Response.json({ error: error.message }, { status: error.status })
  console.error("Checkout database operation failed")
  return Response.json(
    { error: "Unable to process your request. Please try again." },
    { status: 503 }
  )
}
