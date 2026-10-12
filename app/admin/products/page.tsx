import Link from "next/link"
import { asc, ilike } from "drizzle-orm"
import { withDatabase } from "@/lib/db/client"
import { products, categories } from "@/lib/db/schema"
import { requireAdmin } from "@/lib/server/admin"
import ActionForm from "@/components/action-form"
import { saveProduct } from "../actions"
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>
}) {
  await requireAdmin()
  const query = await searchParams
  const page = Math.max(1, Math.min(10000, Number(query.page) || 1))
  const q = (query.q || "").slice(0, 100)
  const data = await withDatabase(async (tx) => ({
    products: await tx
      .select()
      .from(products)
      .where(q ? ilike(products.name, `%${q}%`) : undefined)
      .orderBy(asc(products.name))
      .limit(30)
      .offset((page - 1) * 30),
    categories: await tx
      .select()
      .from(categories)
      .orderBy(asc(categories.position)),
  }))
  return (
    <div className="space-y-6">
      <h2 className="text-2xl">Products & stock</h2>
      <form className="flex gap-3">
        <input
          name="q"
          aria-label="Search products"
          defaultValue={q}
          className="min-w-0 border p-2"
        />
        <button className="border p-2">Search</button>
      </form>
      {data.products.map((p) => (
        <article className="border p-4" key={p.id}>
          <Link
            href={`/admin/products/${encodeURIComponent(p.id)}`}
            className="underline"
          >
            {p.name}
          </Link>
          <p>{p.active ? "Published" : "Archived / draft"}</p>
        </article>
      ))}
      <nav className="flex gap-5">
        {page > 1 && (
          <Link
            href={`/admin/products?page=${page - 1}&q=${encodeURIComponent(q)}`}
          >
            Previous
          </Link>
        )}
        {data.products.length === 30 && (
          <Link
            href={`/admin/products?page=${page + 1}&q=${encodeURIComponent(q)}`}
          >
            Next
          </Link>
        )}
      </nav>
      <details className="border p-5">
        <summary>Create a product</summary>
        <p className="my-4">
          New products start as drafts. Search for the new product, add
          variants, verified stock and an image, then publish.
        </p>
        <ActionForm action={saveProduct} label="Create draft">
          <label className="block">
            Name <input name="name" minLength={3} maxLength={200} required />
          </label>
          <label className="block">
            URL slug{" "}
            <input
              name="slug"
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              maxLength={200}
              required
            />
          </label>
          <label className="block">
            Category{" "}
            <select name="categoryId">
              {data.categories.map((c) => (
                <option value={c.id} key={c.id}>
                  {c.department} / {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            Description
            <textarea
              name="description"
              minLength={10}
              maxLength={10000}
              required
            />
          </label>
        </ActionForm>
      </details>
    </div>
  )
}
