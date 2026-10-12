"use client"
import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useCart } from "./cart-context"
import { formatPrice } from "@/lib/money"
import type { SavedAddress } from "./account-forms"

type Quote = {
  subtotalMinor: number
  shippingMinor: number
  totalMinor: number
  lines: {
    variantId: string
    quantity: number
    name: string
    unitPriceMinor: number
    sku?: string
    options?: Record<string, string>
  }[]
}
export default function CheckoutClient({
  mode,
  account = null,
}: {
  mode: "disabled" | "demo" | "cod"
  account?: {
    name: string
    email: string
    phone: string
    addresses: SavedAddress[]
  } | null
}) {
  const { items, clearCart, updateQuantity, removeItem, itemCount } = useCart()
  const [summary, setSummary] = useState<{ cart: string; quote: Quote } | null>(
    null
  )
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  const [form, setForm] = useState<Record<string, string>>({
    name: account?.name || "",
    email: account?.email || "",
    phone: account?.phone || "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    postalCode: "",
  })
  const [receipt, setReceipt] = useState<{
    id: string
    totalMinor: number
    mode: string
    emailQueued?: boolean
  } | null>(null)
  const requestKey = useRef({ payload: "", key: "" })
  const cart = JSON.stringify(
    items.map((i) => ({ variantId: i.id, quantity: i.quantity }))
  )
  const quote = summary?.cart === cart ? summary.quote : null
  useEffect(() => {
    if (mode === "disabled" || cart === "[]") return
    const controller = new AbortController()
    fetch("/api/checkout/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: cart,
      signal: controller.signal,
    })
      .then(async (response) => {
        const result = await response.json()
        if (!response.ok) throw new Error(result.error)
        setSummary({ cart, quote: result })
        setError("")
      })
      .catch((e) => {
        if (e.name !== "AbortError")
          setError(e.message || "Unable to load order summary.")
      })
    return () => controller.abort()
  }, [cart, mode])
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!quote || busy) return
    const fields = new FormData(event.currentTarget)
    const value = (name: string) => String(fields.get(name) || "")
    const payload = {
      items: JSON.parse(cart),
      expectedTotalMinor: quote.totalMinor,
      saveAddress: fields.get("saveAddress") === "on",
      customer: {
        name: value("name"),
        email: value("email"),
        phone: value("phone"),
      },
      address: {
        line1: value("line1"),
        line2: value("line2"),
        city: value("city"),
        state: value("state"),
        postalCode: value("postalCode"),
        country: "IN",
      },
    }
    const serialized = JSON.stringify(payload)
    if (requestKey.current.payload !== serialized)
      requestKey.current = { payload: serialized, key: crypto.randomUUID() }
    setBusy(true)
    setError("")
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          idempotencyKey: requestKey.current.key,
        }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error)
      setReceipt(result)
      clearCart()
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Unable to place order. Please retry."
      )
    } finally {
      setBusy(false)
    }
  }
  const fields = [
    { name: "name", label: "Full name", autoComplete: "name" },
    { name: "email", label: "Email", type: "email", autoComplete: "email" },
    { name: "phone", label: "Phone", type: "tel", autoComplete: "tel" },
    { name: "line1", label: "Street address", autoComplete: "address-line1" },
    {
      name: "line2",
      label: "Apartment / landmark (optional)",
      autoComplete: "address-line2",
    },
    { name: "city", label: "City", autoComplete: "address-level2" },
    { name: "state", label: "State", autoComplete: "address-level1" },
    { name: "postalCode", label: "PIN code", autoComplete: "postal-code" },
  ]
  return (
    <main className="mx-auto min-h-[60vh] max-w-5xl px-5 py-16 sm:px-10">
      <Link href="/shop" className="underline underline-offset-4">
        Return to shop
      </Link>
      <h1 className="my-8 text-4xl">Checkout</h1>
      {receipt ? (
        <div role="status" className="space-y-4 border p-8">
          <h2 className="text-2xl">
            {receipt.mode === "demo" ? "Test order saved" : "Order received"}
          </h2>
          <p>Reference: {receipt.id}</p>
          <p>Total: {formatPrice(receipt.totalMinor / 100)}</p>
          <p>
            {receipt.mode === "demo"
              ? "This is a demonstration order. No payment or delivery will be processed."
              : "Payment method: cash on delivery."}
          </p>
          <p>
            {receipt.emailQueued
              ? "Your confirmation email is queued. Please keep this order reference."
              : "Your order is saved. Email confirmation is currently unavailable; please keep this reference."}
          </p>
        </div>
      ) : mode === "disabled" ? (
        <p className="border p-8">
          We’re preparing the store. Checkout is not open yet.
        </p>
      ) : !items.length ? (
        <p>Your bag is empty.</p>
      ) : (
        <div className="grid gap-10 md:grid-cols-2">
          <form
            onSubmit={submit}
            className="order-2 min-w-0 space-y-5 md:order-1"
          >
            {!account && (
              <p>
                <Link
                  href="/login?next=/checkout"
                  className="underline underline-offset-4"
                >
                  Sign in
                </Link>{" "}
                to use saved addresses and keep this order in your account, or
                continue as a guest.
              </p>
            )}
            {!!account?.addresses.length && (
              <label className="block">
                Use a saved address
                <select
                  aria-label="Saved delivery address"
                  defaultValue=""
                  className="mt-2 w-full border p-3"
                  onChange={(e) => {
                    const address = account.addresses.find(
                      (a) => a.id === e.target.value
                    )
                    if (address)
                      setForm((previous) => ({
                        ...previous,
                        line1: address.line1,
                        line2: address.line2,
                        city: address.city,
                        state: address.state,
                        postalCode: address.postalCode,
                      }))
                  }}
                >
                  <option value="">Choose an address</option>
                  {account.addresses.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.line1}, {a.city} {a.postalCode}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {mode === "demo" && (
              <p className="border p-4">
                Test checkout — no payment or delivery. Use fictional contact
                details.
              </p>
            )}
            {fields.map((field) => (
              <label key={field.name} className="block">
                <span className="mb-2 block">{field.label}</span>
                <input
                  name={field.name}
                  type={field.type || "text"}
                  autoComplete={field.autoComplete}
                  value={form[field.name] || ""}
                  onChange={(e) =>
                    setForm((previous) => ({
                      ...previous,
                      [field.name]: e.target.value,
                    }))
                  }
                  readOnly={field.name === "email" && Boolean(account)}
                  required={field.name !== "line2"}
                  minLength={
                    field.name === "line1"
                      ? 5
                      : ["name", "city", "state"].includes(field.name)
                        ? 2
                        : undefined
                  }
                  maxLength={
                    field.name === "email"
                      ? 254
                      : field.name === "name"
                        ? 120
                        : ["city", "state"].includes(field.name)
                          ? 100
                          : field.name === "phone"
                            ? 16
                            : field.name === "postalCode"
                              ? 6
                              : 200
                  }
                  pattern={
                    field.name === "postalCode"
                      ? "[1-9][0-9]{5}"
                      : field.name === "phone"
                        ? "[+]?[0-9]{10,15}"
                        : undefined
                  }
                  className="w-full border border-border bg-background p-3"
                />
                {field.name === "line1" && (
                  <span className="mt-1 block text-sm">
                    Include the building or street name, not just the house
                    number.
                  </span>
                )}
                {field.name === "phone" && (
                  <span className="mt-1 block text-sm">
                    Use 10–15 digits, optionally starting with +. No spaces or
                    punctuation.
                  </span>
                )}
              </label>
            ))}
            <p>
              Delivery within India. ₹99 below ₹599; free from ₹599.{" "}
              {mode === "cod" && "Payment: cash on delivery."}
            </p>
            <p className="text-sm">
              By placing an order, you agree to our{" "}
              <Link className="underline" href="/terms">
                store terms
              </Link>
              . See{" "}
              <Link className="underline" href="/privacy">
                privacy
              </Link>
              ,{" "}
              <Link className="underline" href="/shipping">
                shipping
              </Link>{" "}
              and{" "}
              <Link className="underline" href="/returns">
                returns information
              </Link>
              .
            </p>
            {account && (
              <label className="flex items-center gap-3">
                <input name="saveAddress" type="checkbox" />
                Save this delivery address to my account
              </label>
            )}
            <button
              disabled={!quote || busy}
              className="w-full bg-foreground px-6 py-4 text-background disabled:opacity-40"
            >
              {busy
                ? "Saving order…"
                : mode === "demo"
                  ? "Save test order"
                  : "Place order"}
            </button>
          </form>
          <aside
            aria-label="Order summary"
            className="order-1 min-w-0 space-y-5 self-start border p-5 sm:p-6 md:order-2"
          >
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-2xl">Your bag</h2>
              <span className="text-sm text-muted-foreground">
                {itemCount} {itemCount === 1 ? "item" : "items"}
              </span>
            </div>
            <ul className="divide-y divide-border">
              {items.map((item) => {
                const line = quote?.lines.find(
                  (line) => line.variantId === item.id
                )
                const details = Object.entries(line?.options || {})
                  .map(([key, value]) => `${key}: ${value}`)
                  .join(" · ")
                return (
                  <li key={item.id} className="flex gap-4 py-5 first:pt-0">
                    <Link
                      href={item.slug ? `/shop/${item.slug}` : "/shop"}
                      className="h-28 w-20 shrink-0 overflow-hidden bg-muted sm:w-24"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.image}
                        alt={line?.name || item.name}
                        width={96}
                        height={112}
                        className="h-full w-full object-cover"
                      />
                    </Link>
                    <div className="min-w-0 flex-1 space-y-2">
                      <Link
                        href={item.slug ? `/shop/${item.slug}` : "/shop"}
                        className="block leading-snug font-medium break-words hover:underline"
                      >
                        {item.name}
                      </Link>
                      {details && (
                        <p className="text-sm break-words text-muted-foreground">
                          {details}
                        </p>
                      )}
                      <p className="text-sm">
                        {line
                          ? `${formatPrice(line.unitPriceMinor / 100)} each`
                          : "Checking price…"}
                      </p>
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div
                          role="group"
                          aria-label={`Quantity for ${item.name}`}
                          className="inline-flex items-center border border-border"
                        >
                          <button
                            type="button"
                            aria-label={`Decrease quantity for ${item.name}`}
                            disabled={busy || item.quantity <= 1}
                            onClick={() =>
                              updateQuantity(item.id, item.quantity - 1)
                            }
                            className="flex size-10 items-center justify-center text-xl hover:bg-muted disabled:opacity-30"
                          >
                            −
                          </button>
                          <span
                            aria-live="polite"
                            className="min-w-8 text-center tabular-nums"
                          >
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            aria-label={`Increase quantity for ${item.name}`}
                            disabled={busy || item.quantity >= 10}
                            onClick={() =>
                              updateQuantity(item.id, item.quantity + 1)
                            }
                            className="flex size-10 items-center justify-center text-xl hover:bg-muted disabled:opacity-30"
                          >
                            +
                          </button>
                        </div>
                        <span className="font-semibold tabular-nums">
                          {line
                            ? formatPrice(
                                (line.unitPriceMinor * item.quantity) / 100
                              )
                            : "—"}
                        </span>
                      </div>
                      <button
                        type="button"
                        disabled={busy}
                        aria-label={`Remove ${item.name} from bag`}
                        onClick={() => removeItem(item.id)}
                        className="min-h-10 text-sm underline underline-offset-4 disabled:opacity-40"
                      >
                        Remove
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
            <Link
              href="/shop"
              className="inline-block text-sm underline underline-offset-4"
            >
              Continue shopping
            </Link>
            <h3 className="border-t pt-5 text-xl">Order summary</h3>
            {quote ? (
              <>
                <p>Subtotal: {formatPrice(quote.subtotalMinor / 100)}</p>
                <p>Delivery: {formatPrice(quote.shippingMinor / 100)}</p>
                <p className="font-semibold">
                  Total: {formatPrice(quote.totalMinor / 100)}
                </p>
              </>
            ) : (
              <p>Checking prices and availability…</p>
            )}
            {error && (
              <p role="alert" className="text-red-700">
                {error}
              </p>
            )}
          </aside>
        </div>
      )}
    </main>
  )
}
