import { notFound } from "next/navigation"
import { eq } from "drizzle-orm"
import { z } from "zod"
import { withDatabase } from "@/lib/db/client"
import { orders, orderAddresses, shipments } from "@/lib/db/schema"
import { loadAdminOrderItems } from "@/lib/server/admin-order-items"
import OrderItemImage from "@/components/order-item-image"
import { requireAdmin } from "@/lib/server/admin"
import { formatPrice } from "@/lib/money"
import { canTransition, orderStatuses } from "@/lib/fulfilment"
import ActionForm from "@/components/action-form"
import { orderStatus, codCollected } from "../../actions"
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireAdmin()
  const { id } = await params
  if (!z.uuid().safeParse(id).success) notFound()
  const data = await withDatabase(async (tx) => ({
    order: (await tx.select().from(orders).where(eq(orders.id, id)))[0],
    items: await loadAdminOrderItems(tx, [id]),
    address: (
      await tx
        .select()
        .from(orderAddresses)
        .where(eq(orderAddresses.orderId, id))
    )[0],
    shipment: (
      await tx.select().from(shipments).where(eq(shipments.orderId, id))
    )[0],
  }))
  if (!data.order) notFound()
  const o = data.order
  const next = orderStatuses.filter(
    (s) => s !== o.status && canTransition(o.status, s)
  )
  return (
    <article className="space-y-6">
      <h2 className="text-2xl break-all">Order {id}</h2>
      <p>
        {o.status} · {o.paymentMethod} · {o.paymentStatus}
      </p>
      <p>
        {o.customerDetails?.name} · {o.customerDetails?.email} ·{" "}
        {o.customerDetails?.phone}
      </p>
      <p>
        {Object.values(data.address?.address || {})
          .filter(Boolean)
          .join(", ")}
      </p>
      {data.items.map(({ item: i, image }) => (
        <div key={i.id} className="flex gap-4 border p-4">
          <OrderItemImage src={image} name={i.name} />
          <div className="min-w-0 space-y-2">
            <p>{i.name}</p>
            <p className="text-sm">
              SKU: {i.sku} ·{" "}
              {Object.entries((i.options || {}) as Record<string, string>)
                .map(([key, value]) => `${key}: ${value}`)
                .join(" · ")}
            </p>
            <p>
              {i.quantity} × {formatPrice(i.unitPriceMinor / 100)}
            </p>
          </div>
        </div>
      ))}
      <p>
        Delivery {formatPrice(o.shippingMinor / 100)} · Total{" "}
        {formatPrice(o.totalMinor / 100)}
      </p>
      {data.shipment && (
        <p>
          Tracking: {data.shipment.carrier} · {data.shipment.trackingNumber} ·{" "}
          <a
            href={data.shipment.trackingUrl}
            rel="noopener noreferrer"
            target="_blank"
            className="underline"
          >
            Track shipment
          </a>
        </p>
      )}
      {next.length > 0 && (
        <ActionForm action={orderStatus} label="Update order">
          <input type="hidden" name="id" value={id} />
          <label className="block">
            Next status{" "}
            <select name="status">
              {next.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <p>
            Shipping requires carrier, tracking number and HTTPS tracking URL.
            Cancellation restores stock once.
          </p>
          <label className="block">
            Carrier <input name="carrier" maxLength={100} />
          </label>
          <label className="block">
            Tracking number <input name="trackingNumber" maxLength={150} />
          </label>
          <label className="block">
            Tracking URL{" "}
            <input name="trackingUrl" type="url" maxLength={1000} />
          </label>
        </ActionForm>
      )}
      {o.status === "delivered" &&
        o.paymentMethod === "cod" &&
        o.paymentStatus === "unpaid" && (
          <ActionForm action={codCollected} label="Confirm COD money received">
            <input type="hidden" name="id" value={id} />
            <p>
              Use only after confirming receipt of{" "}
              {formatPrice(o.totalMinor / 100)} from the delivery partner.
            </p>
          </ActionForm>
        )}
    </article>
  )
}
