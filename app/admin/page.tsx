import Link from "next/link"
import { desc, eq } from "drizzle-orm"
import { withDatabase } from "@/lib/db/client"
import { orders, returnRequests } from "@/lib/db/schema"
import { requireAdmin } from "@/lib/server/admin"
import { formatPrice } from "@/lib/money"
import ActionForm from "@/components/action-form"
import { returnStatus } from "./actions"
import { loadAdminOrderItems } from "@/lib/server/admin-order-items"
import OrderItemImage from "@/components/order-item-image"
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string }>
}) {
  await requireAdmin()
  const query = await searchParams
  const page = Math.max(1, Math.min(10000, Number(query.page) || 1))
  const data = await withDatabase(async (tx) => {
    const pageOrders = await tx
      .select()
      .from(orders)
      .where(query.status ? eq(orders.status, query.status) : undefined)
      .orderBy(desc(orders.createdAt))
      .limit(30)
      .offset((page - 1) * 30)
    return {
      orders: pageOrders,
      items: await loadAdminOrderItems(
        tx,
        pageOrders.map((order) => order.id)
      ),
      returns: await tx
        .select()
        .from(returnRequests)
        .orderBy(desc(returnRequests.createdAt))
        .limit(50),
    }
  })
  return (
    <div className="space-y-8">
      <h2 className="text-2xl">Orders</h2>
      <form className="flex flex-wrap gap-3">
        <label>
          Status{" "}
          <select
            name="status"
            defaultValue={query.status || ""}
            className="border p-2"
          >
            <option value="">All</option>
            {["placed", "processing", "shipped", "delivered", "cancelled"].map(
              (s) => (
                <option key={s}>{s}</option>
              )
            )}
          </select>
        </label>
        <button className="border p-2">Filter</button>
      </form>
      {!data.orders.length && <p>No orders on this page.</p>}
      {data.orders.map((o) => (
        <article key={o.id} className="space-y-2 border p-5">
          <Link href={`/admin/orders/${o.id}`} className="break-all underline">
            {o.id}
          </Link>
          <p>
            {o.customerDetails?.name} · {o.createdAt.toLocaleString("en-IN")}
          </p>
          <p>
            {o.status} · {o.paymentMethod} · {o.paymentStatus} ·{" "}
            {formatPrice(o.totalMinor / 100)}
          </p>
          <div className="flex flex-wrap gap-4 pt-2">
            {data.items
              .filter(({ item }) => item.orderId === o.id)
              .map(({ item, image }) => (
                <Link
                  key={item.id}
                  href={`/admin/orders/${o.id}`}
                  className="flex max-w-sm min-w-0 items-center gap-3"
                >
                  <OrderItemImage src={image} name={item.name} />
                  <span className="min-w-0 text-sm">
                    {item.name}
                    <span className="block">Quantity: {item.quantity}</span>
                  </span>
                </Link>
              ))}
          </div>
        </article>
      ))}
      <nav className="flex gap-5">
        {page > 1 && (
          <Link
            href={`/admin?page=${page - 1}&status=${encodeURIComponent(query.status || "")}`}
          >
            Previous
          </Link>
        )}
        {data.orders.length === 30 && (
          <Link
            href={`/admin?page=${page + 1}&status=${encodeURIComponent(query.status || "")}`}
          >
            Next
          </Link>
        )}
      </nav>
      <h2 className="text-2xl">Full-order return requests</h2>
      <p>
        Approve eligibility manually. Mark received only after inspecting all
        items as suitable for restocking. Close only after any required refund
        has been completed outside the website; this records the refund, it does
        not send money.
      </p>
      {data.returns.map((r) => (
        <article key={r.id} className="space-y-3 border p-5">
          <Link className="underline" href={`/admin/orders/${r.orderId}`}>
            Order {r.orderId}
          </Link>
          <p>{r.reason}</p>
          <p>Status: {r.status}</p>
          <p>{r.note}</p>
          {!["closed", "rejected"].includes(r.status) && (
            <ActionForm action={returnStatus} label="Update return">
              <input type="hidden" name="id" value={r.id} />
              <label className="block">
                Status{" "}
                <select name="status" required>
                  {(r.status === "requested"
                    ? ["approved", "rejected"]
                    : r.status === "approved"
                      ? ["received"]
                      : ["closed"]
                  ).map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                Inspection / refund reference
                <textarea name="note" minLength={3} maxLength={2000} required />
              </label>
            </ActionForm>
          )}
        </article>
      ))}
    </div>
  )
}
