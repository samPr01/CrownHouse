import Link from "next/link"
import { desc } from "drizzle-orm"
import { withDatabase } from "@/lib/db/client"
import { customers } from "@/lib/db/schema"
import { requireAdmin } from "@/lib/server/admin"
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  await requireAdmin()
  const query = await searchParams
  const page = Math.max(1, Math.min(10000, Number(query.page) || 1))
  const list = await withDatabase((tx) =>
    tx
      .select()
      .from(customers)
      .orderBy(desc(customers.createdAt))
      .limit(50)
      .offset((page - 1) * 50)
  )
  return (
    <section className="space-y-5">
      <h2 className="text-2xl">Customers</h2>
      <p>
        Guest checkout records and confirmed account profiles are kept separate.
      </p>
      {list.map((c) => (
        <article className="border p-4" key={c.id}>
          <p>{c.name}</p>
          <p className="break-all">
            {c.email} · {c.phone}
          </p>
          <p>{c.authUserId ? "Account" : "Guest"}</p>
        </article>
      ))}
      <nav className="flex gap-5">
        {page > 1 && (
          <Link href={`/admin/customers?page=${page - 1}`}>Previous</Link>
        )}
        {list.length === 50 && (
          <Link href={`/admin/customers?page=${page + 1}`}>Next</Link>
        )}
      </nav>
    </section>
  )
}
