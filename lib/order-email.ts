export type OrderEmailData = {
  id: string
  name: string
  email: string
  phone: string
  subtotalMinor: number
  shippingMinor: number
  totalMinor: number
  address: Record<string, unknown>
  items: {
    name: string
    sku: string
    options: unknown
    quantity: number
    unitPriceMinor: number
  }[]
}
export function escapeHtml(value: unknown) {
  return String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!
  )
}
const money = (value: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(
    value / 100
  )
export function orderEmail(
  data: OrderEmailData,
  kind: "merchant_order" | "customer_confirmation"
) {
  const merchant = kind === "merchant_order"
  const heading = merchant
    ? "New cash on delivery order"
    : "Your CrownHouse order is confirmed"
  const address = ["line1", "line2", "city", "state", "postalCode", "country"]
    .map((k) => String(data.address[k] || ""))
    .filter(Boolean)
    .join(", ")
  const lines = data.items.map((i) => {
    const options =
      i.options && typeof i.options === "object"
        ? Object.entries(i.options)
            .map(([key, value]) => `${key}: ${String(value)}`)
            .join(", ")
        : ""
    return `${i.name}${options ? ` (${options})` : ""} | SKU: ${i.sku} | Qty: ${i.quantity} | ${money(i.unitPriceMinor * i.quantity)}`
  })
  const text = [
    "CrownHouse · Simply Beyond",
    heading,
    `Order reference: ${data.id}`,
    `Customer: ${data.name}`,
    ...(merchant ? [`Email: ${data.email}`, `Phone: ${data.phone}`] : []),
    `Delivery address: ${address}`,
    "",
    ...lines,
    "",
    `Subtotal: ${money(data.subtotalMinor)}`,
    `Delivery: ${money(data.shippingMinor)}`,
    `Amount due on delivery: ${money(data.totalMinor)}`,
    "Payment method: Cash on delivery. Payment has not been collected.",
    merchant
      ? "Please review and prepare this order."
      : "We’ll prepare your order. For help, contact hello@crownhouse.in or +919232133533.",
  ].join("\n")
  return {
    subject: merchant
      ? `New COD order · CrownHouse · ${data.id}`
      : `Your CrownHouse order · ${data.id}`,
    text,
    html: `<!doctype html><html><body style="margin:0;background:#faf9f6;color:#23201d;font-family:Arial,sans-serif"><main style="max-width:640px;margin:24px auto;padding:32px;background:white;border:1px solid #e6dfd5"><p style="letter-spacing:3px">CROWNHOUSE</p><h1 style="font-size:24px">${escapeHtml(heading)}</h1><div style="font-size:16px;line-height:1.7;white-space:pre-wrap">${escapeHtml(text)}</div></main></body></html>`,
  }
}
