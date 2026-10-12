export const orderStatuses = [
  "placed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
] as const
export type OrderStatus = (typeof orderStatuses)[number]
export function canTransition(from: string, to: string) {
  const next: Record<string, string[]> = {
    placed: ["processing", "cancelled"],
    processing: ["shipped", "cancelled"],
    shipped: ["delivered"],
    delivered: [],
    cancelled: [],
  }
  return from === to || (next[from] || []).includes(to)
}
export function adminAllowed(
  email: string | undefined,
  confirmed: boolean,
  allowlist: string | undefined
) {
  return Boolean(
    confirmed &&
    email &&
    (allowlist || "")
      .split(",")
      .map((v) => v.trim().toLowerCase())
      .filter(Boolean)
      .includes(email.toLowerCase())
  )
}
