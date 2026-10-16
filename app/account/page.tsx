import Link from "next/link"
import { MapPin, Package, UserRound } from "lucide-react"
import { accountDetails, accountOrders } from "@/lib/server/account"
import { ProfileForm, AddressForm } from "@/components/account-forms"
import { logout } from "@/app/auth/actions"
import { formatPrice } from "@/lib/money"
import { adminAllowed } from "@/lib/fulfilment"

export const dynamic = "force-dynamic"
const card =
  "rounded-2xl border border-border bg-background p-5 shadow-sm sm:p-6"
const control =
  "inline-flex shrink-0 items-center justify-center rounded-xl border border-border px-4 py-2 text-sm"

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; view?: string }>
}) {
  const query = await searchParams
  const requested = Number(query.page || 1)
  const page =
    Number.isInteger(requested) && requested > 0 && requested < 10000
      ? requested
      : 1
  const view =
    query.view === "orders" || (query.page && !query.view)
      ? "orders"
      : "profile"
  const profile = await accountDetails()
  const orders = await accountOrders(page)
  return (
    <main className="mx-auto max-w-6xl px-5 py-10 sm:px-10 sm:py-14">
      <h1 className="mb-8 text-3xl tracking-tight sm:mb-12 sm:text-4xl">
        Your CrownHouse Account
      </h1>
      <div className="grid gap-8 md:grid-cols-[160px_minmax(0,1fr)] md:gap-12">
        <aside className="min-w-0">
          <nav
            aria-label="Account navigation"
            className="flex gap-6 border-b border-border pb-4 md:flex-col md:gap-4 md:border-0 md:pb-0"
          >
            <Link
              href="/account?view=orders"
              aria-current={view === "orders" ? "page" : undefined}
              className={
                view === "orders"
                  ? "inline-flex items-center gap-3 font-semibold underline underline-offset-8"
                  : "inline-flex items-center gap-3 text-muted-foreground"
              }
            >
              <Package size={18} aria-hidden="true" />
              Orders
            </Link>
            <Link
              href="/account"
              aria-current={view === "profile" ? "page" : undefined}
              className={
                view === "profile"
                  ? "inline-flex items-center gap-3 font-semibold underline underline-offset-8"
                  : "inline-flex items-center gap-3 text-muted-foreground"
              }
            >
              <UserRound size={18} aria-hidden="true" />
              Profile
            </Link>
          </nav>
          {adminAllowed(profile.email, true, process.env.ADMIN_EMAILS) && (
            <Link className={control + " mt-6"} href="/admin">
              Manage the store
            </Link>
          )}
        </aside>
        <div className="min-w-0 space-y-9 sm:space-y-12">
          {view === "profile" ? (
            <>
              <section aria-labelledby="profile-heading" className="space-y-4">
                <details>
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 [&::-webkit-details-marker]:hidden">
                    <h2
                      id="profile-heading"
                      className="min-w-0 text-xl font-medium break-words"
                    >
                      {profile.name || "Your profile"}
                    </h2>
                    <span className={control}>
                      Edit<span className="sr-only"> profile</span>
                    </span>
                  </summary>
                  <div className={card + " mt-4"}>
                    <ProfileForm {...profile} />
                  </div>
                </details>
                <dl className={card + " space-y-5"}>
                  <div className="grid gap-1 sm:grid-cols-[130px_minmax(0,1fr)] sm:gap-5">
                    <dt className="text-sm text-muted-foreground">Email</dt>
                    <dd className="min-w-0 break-all sm:text-right">
                      {profile.email}
                    </dd>
                  </div>
                  <div className="grid gap-1 sm:grid-cols-[130px_minmax(0,1fr)] sm:gap-5">
                    <dt className="text-sm text-muted-foreground">
                      Phone number
                    </dt>
                    <dd className="sm:text-right">
                      {profile.phone || "Not added"}
                    </dd>
                  </div>
                </dl>
              </section>
              <section
                aria-labelledby="addresses-heading"
                className="space-y-4"
              >
                {profile.addresses.length < 10 ? (
                  <details>
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 [&::-webkit-details-marker]:hidden">
                      <h2
                        id="addresses-heading"
                        className="text-xl font-medium"
                      >
                        Addresses
                      </h2>
                      <span className={control}>
                        Add<span className="sr-only"> address</span>
                      </span>
                    </summary>
                    <div className="mt-4">
                      <AddressForm />
                    </div>
                  </details>
                ) : (
                  <h2 id="addresses-heading" className="text-xl font-medium">
                    Addresses
                  </h2>
                )}
                {!profile.addresses.length && (
                  <div className={card + " flex items-center gap-4"}>
                    <MapPin
                      size={22}
                      className="shrink-0 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <p className="text-muted-foreground">No addresses added</p>
                  </div>
                )}
                <div className="space-y-4">
                  {profile.addresses.map((address) => (
                    <article key={address.id} className={card}>
                      <div className="flex items-start gap-4">
                        <MapPin
                          size={22}
                          className="mt-1 shrink-0 text-muted-foreground"
                          aria-hidden="true"
                        />
                        <address className="min-w-0 break-words not-italic">
                          <p>{address.line1}</p>
                          {address.line2 && <p>{address.line2}</p>}
                          <p>
                            {address.city}, {address.state} {address.postalCode}
                          </p>
                          <p>India</p>
                        </address>
                      </div>
                      <details className="mt-4">
                        <summary className="w-fit cursor-pointer text-sm underline underline-offset-4">
                          Edit address
                        </summary>
                        <div className="mt-4">
                          <AddressForm address={address} />
                        </div>
                      </details>
                    </article>
                  ))}
                </div>
              </section>
            </>
          ) : (
            <section aria-labelledby="orders-heading" className="space-y-5">
              <h2 id="orders-heading" className="text-xl font-medium">
                Your orders
              </h2>
              {!orders.length ? (
                <div className={card + " flex items-center gap-4"}>
                  <Package
                    size={22}
                    className="shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <p>
                    No orders on this page. Orders placed while signed in will
                    appear here.
                  </p>
                </div>
              ) : (
                orders.map((order) => (
                  <article key={order.id} className={card + " space-y-3"}>
                    <Link
                      href={`/account/orders/${order.id}`}
                      className="break-all underline underline-offset-4"
                    >
                      Order {order.id}
                    </Link>
                    <p>
                      {order.createdAt.toLocaleDateString("en-IN", {
                        timeZone: "Asia/Kolkata",
                      })}{" "}
                      · {order.status} · {formatPrice(order.totalMinor / 100)}
                    </p>
                    <p>
                      Payment:{" "}
                      {order.paymentMethod === "cod"
                        ? "Cash on delivery"
                        : order.paymentMethod}{" "}
                      · {order.paymentStatus}
                    </p>
                    <p>
                      {order.items
                        .map((item) => `${item.name} × ${item.quantity}`)
                        .join("; ")}
                    </p>
                  </article>
                ))
              )}
              <nav className="flex gap-6" aria-label="Order history pages">
                {page > 1 && (
                  <Link href={`/account?view=orders&page=${page - 1}`}>
                    Previous
                  </Link>
                )}
                {orders.length === 20 && (
                  <Link href={`/account?view=orders&page=${page + 1}`}>
                    Next
                  </Link>
                )}
              </nav>
              <p className="text-sm text-muted-foreground">
                Guest orders are kept separate from your account for privacy.
              </p>
            </section>
          )}
          <form action={logout}>
            <button className={control}>Sign out</button>
          </form>
        </div>
      </div>
    </main>
  )
}
