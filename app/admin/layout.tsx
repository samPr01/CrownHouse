import Link from "next/link"
import { requireAdmin } from "@/lib/server/admin"
export const dynamic = "force-dynamic"
export const metadata = {
  title: "Store administration | CrownHouse",
  robots: { index: false, follow: false },
}
export default async function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireAdmin()
  return (
    <main className="mx-auto max-w-6xl px-5 py-10">
      <header className="mb-8 space-y-5">
        <h1 className="text-3xl">CrownHouse administration</h1>
        <nav className="flex flex-wrap gap-5 underline">
          <Link href="/admin">Orders & returns</Link>
          <Link href="/admin/products">Products & stock</Link>
          <Link href="/admin/customers">Customers</Link>
          <Link href="/admin/messages">Messages</Link>
          <Link href="/account">My account</Link>
          <Link href="/">Storefront</Link>
        </nav>
      </header>
      {children}
    </main>
  )
}
