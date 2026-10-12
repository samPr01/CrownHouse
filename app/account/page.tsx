import Link from "next/link"
import { accountDetails,accountOrders } from "@/lib/server/account"
import { ProfileForm,AddressForm } from "@/components/account-forms"
import { logout } from "@/app/auth/actions"
import { formatPrice } from "@/lib/money"
import {adminAllowed} from "@/lib/fulfilment"
export const dynamic="force-dynamic"
export default async function Page({searchParams}:{searchParams:Promise<{page?:string}>}) {
  const query=await searchParams;const requested=Number(query.page||1);const page=Number.isInteger(requested)&&requested>0&&requested<10000?requested:1
  const profile=await accountDetails();const orders=await accountOrders(page)
  return <main className="mx-auto max-w-6xl space-y-12 px-5 py-14 sm:px-10">
    <div className="flex flex-wrap items-center justify-between gap-5"><h1 className="text-4xl">Your account</h1><form action={logout}><button className="underline underline-offset-4">Sign out</button></form></div>
    {adminAllowed(profile.email,true,process.env.ADMIN_EMAILS)&&<Link className="inline-block border px-5 py-3" href="/admin">Manage the store</Link>}
    <section className="max-w-xl space-y-6"><h2 className="text-2xl">Your profile</h2><ProfileForm {...profile}/></section>
    <section className="space-y-6"><h2 className="text-2xl">Saved addresses</h2>
      {profile.addresses.length===0&&<p>No saved addresses yet.</p>}
      <div className="grid gap-5 md:grid-cols-2">{profile.addresses.map(address=><AddressForm key={address.id} address={address}/>)}</div>
      {profile.addresses.length<10&&<details className="max-w-xl"><summary className="cursor-pointer underline underline-offset-4">Add an address</summary><div className="mt-5"><AddressForm/></div></details>}
    </section>
    <section className="space-y-6"><h2 className="text-2xl">Your orders</h2>
      {!orders.length?<p>No orders on this page. Orders placed while signed in will appear here.</p>:orders.map(order=><article key={order.id} className="space-y-3 border p-5">
        <Link href={`/account/orders/${order.id}`} className="break-all underline underline-offset-4">Order {order.id}</Link>
        <p>{order.createdAt.toLocaleDateString("en-IN",{timeZone:"Asia/Kolkata"})} · {order.status} · {formatPrice(order.totalMinor/100)}</p>
        <p>Payment: {order.paymentMethod==="cod"?"Cash on delivery":order.paymentMethod} · {order.paymentStatus}</p>
        <p>{order.items.map(i=>`${i.name} × ${i.quantity}`).join("; ")}</p>
      </article>)}
      <nav className="flex gap-6" aria-label="Order history pages">{page>1&&<Link href={`/account?page=${page-1}`}>Previous</Link>}{orders.length===20&&<Link href={`/account?page=${page+1}`}>Next</Link>}</nav>
      <p className="text-sm text-muted-foreground">Guest orders are kept separate from your account for privacy.</p>
    </section>
  </main>
}
