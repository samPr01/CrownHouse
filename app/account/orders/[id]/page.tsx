import Link from "next/link"
import { z } from "zod"
import { notFound } from "next/navigation"
import { accountOrder } from "@/lib/server/account"
import { formatPrice } from "@/lib/money"
import ActionForm from "@/components/action-form"
import {cancelOwnOrder,requestOwnReturn} from "../../fulfilment-actions"
export const dynamic="force-dynamic"
export default async function Page({params}:{params:Promise<{id:string}>}) {
  const {id}=await params;if(!z.uuid().safeParse(id).success) notFound()
  const data=await accountOrder(id);if(!data) notFound()
  return <main className="mx-auto max-w-3xl space-y-7 px-5 py-14">
    <Link href="/account" className="underline underline-offset-4">Back to your account</Link>
    <h1 className="text-3xl break-all">Order {data.order.id}</h1>
    <p>Status: {data.order.status}</p><p>Payment: {data.order.paymentMethod==="cod"?"Cash on delivery":data.order.paymentMethod} · {data.order.paymentStatus}</p>
    <section className="space-y-3"><h2 className="text-2xl">Items</h2>{data.items.map(i=><div key={i.id} className="border p-4"><p>{i.name} × {i.quantity}</p><p>{Object.entries((i.options||{}) as Record<string,string>).map(([key,value])=>`${key}: ${value}`).join(", ")}</p><p>{formatPrice(i.unitPriceMinor*i.quantity/100)}</p></div>)}</section>
    <p>Delivery: {formatPrice(data.order.shippingMinor/100)}</p><p className="font-semibold">Total: {formatPrice(data.order.totalMinor/100)}</p>
    <section><h2 className="mb-4 text-2xl">Delivery address</h2><p>{[data.address.line1,data.address.line2,data.address.city,data.address.state,data.address.postalCode,"India"].filter(Boolean).join(", ")}</p></section>
    {data.shipment&&<section><h2 className="text-2xl">Shipment</h2><p>{data.shipment.carrier} · {data.shipment.trackingNumber}</p><a className="underline" href={data.shipment.trackingUrl} target="_blank" rel="noopener noreferrer">Track delivery</a></section>}
    {["placed","processing"].includes(data.order.status)&&data.order.paymentStatus==="unpaid"&&<ActionForm action={cancelOwnOrder} label="Cancel this order"><input type="hidden" name="id" value={id}/><p>Cancellation stops fulfilment and restores stock. This action cannot be undone.</p></ActionForm>}
    {data.returnRequest?<section><h2 className="text-2xl">Return request</h2><p>{data.returnRequest.status}</p><p>{data.returnRequest.note}</p></section>:data.order.status==="delivered"&&<ActionForm action={requestOwnReturn} label="Request a return"><input type="hidden" name="id" value={id}/><p>Full-order returns are reviewed by the store. Contact us for individual-item requests. Approval and refund arrangements must be confirmed before sending items back.</p><label className="block">Reason<textarea name="reason" minLength={10} maxLength={2000} required/></label></ActionForm>}
  </main>
}
