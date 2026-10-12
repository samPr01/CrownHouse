import { notFound } from "next/navigation"
import { eq, asc } from "drizzle-orm"
import { withDatabase } from "@/lib/db/client"
import {
  products,
  variants,
  inventory,
  images,
  categories,
} from "@/lib/db/schema"
import { requireAdmin } from "@/lib/server/admin"
import ActionForm from "@/components/action-form"
import { saveProduct, saveVariant, saveImage } from "../../actions"
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireAdmin()
  const { id } = await params
  const data = await withDatabase(async (tx) => ({
    product: (await tx.select().from(products).where(eq(products.id, id)))[0],
    variants: await tx
      .select({ variant: variants, stock: inventory })
      .from(variants)
      .leftJoin(inventory, eq(inventory.variantId, variants.id))
      .where(eq(variants.productId, id))
      .orderBy(asc(variants.position)),
    images: await tx
      .select()
      .from(images)
      .where(eq(images.productId, id))
      .orderBy(asc(images.position)),
    categories: await tx
      .select()
      .from(categories)
      .orderBy(asc(categories.position)),
  }))
  if (!data.product) notFound()
  const p = data.product
  const category = data.categories.find((c) => c.id === p.categoryId)
  const needsSizingReview =
    category?.department === "Footwear" &&
    data.variants.some(({ variant: v }) =>
      /^(xs|s|m|l|xl|xxl)$/i.test(v.name.trim())
    )
  return (
    <div className="space-y-8">
      <h2 className="text-2xl">{p.name}</h2>
      {needsSizingReview && (
        <p role="alert" className="border border-amber-600 p-4">
          Sizing review needed: this footwear has imported clothing-style size
          labels. Confirm the original supplier sizing before publishing changes
          or accepting orders.
        </p>
      )}
      <ActionForm action={saveProduct}>
        <input type="hidden" name="id" value={id} />
        <label className="block">
          Name{" "}
          <input
            name="name"
            defaultValue={p.name}
            minLength={3}
            maxLength={200}
            required
          />
        </label>
        <label className="block">
          URL slug{" "}
          <input
            name="slug"
            defaultValue={p.slug}
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            required
          />
        </label>
        <p>Keep the slug unchanged to preserve existing links.</p>
        <label className="block">
          Category{" "}
          <select name="categoryId" defaultValue={p.categoryId}>
            {data.categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.department} / {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          Description
          <textarea
            name="description"
            defaultValue={p.description}
            minLength={10}
            maxLength={10000}
            required
          />
        </label>
        <label className="block">
          <input name="active" type="checkbox" defaultChecked={p.active} />{" "}
          Published
        </label>
      </ActionForm>
      <section className="space-y-5">
        <h2 className="text-2xl">Variants and verified stock</h2>
        <p>
          Prices are in paise: ₹599 = 59900. Saving a price clears any previous
          compare-at discount. Stock is the absolute quantity physically
          available, not an amount to add.
        </p>
        {[...data.variants, { variant: null, stock: null }].map(
          ({ variant: v, stock }, index) => (
            <details className="border p-5" key={v?.id || "new"}>
              <summary>
                {v
                  ? `${v.name} · ${v.sku} · stock ${stock?.quantity || 0}`
                  : "Add variant"}
              </summary>
              <div className="pt-5">
                <ActionForm action={saveVariant}>
                  <input type="hidden" name="id" value={v?.id || ""} />
                  <input type="hidden" name="productId" value={id} />
                  <input
                    type="hidden"
                    name="expectedQuantity"
                    value={stock?.quantity || 0}
                  />
                  <label className="block">
                    Variant name / size{" "}
                    <input
                      name="name"
                      defaultValue={v?.name}
                      required
                      maxLength={150}
                    />
                  </label>
                  <label className="block">
                    Unique SKU{" "}
                    <input
                      name="sku"
                      defaultValue={v?.sku}
                      required
                      maxLength={150}
                    />
                  </label>
                  <label className="block">
                    Price in paise{" "}
                    <input
                      name="priceMinor"
                      type="number"
                      min={1}
                      max={100000000}
                      defaultValue={v?.priceMinor}
                      required
                    />
                  </label>
                  <label className="block">
                    Verified stock{" "}
                    <input
                      name="quantity"
                      type="number"
                      min={0}
                      max={100000}
                      defaultValue={stock?.quantity || 0}
                      required
                    />
                  </label>
                  <label className="block">
                    Position{" "}
                    <input
                      name="position"
                      type="number"
                      min={0}
                      max={10000}
                      defaultValue={v?.position || index}
                      required
                    />
                  </label>
                  <label className="block">
                    Options JSON
                    <textarea
                      name="options"
                      defaultValue={JSON.stringify(v?.options || { Size: "" })}
                      maxLength={5000}
                      required
                    />
                  </label>
                  <label className="block">
                    <input
                      name="active"
                      type="checkbox"
                      defaultChecked={v?.active ?? true}
                    />{" "}
                    Available variant
                  </label>
                </ActionForm>
              </div>
            </details>
          )
        )}
      </section>
      <section className="space-y-4">
        <h2 className="text-2xl">Product images</h2>
        <p>
          Use HTTPS image URLs you have permission to publish. Position 0 is the
          main image; saving an existing position replaces that image.
        </p>
        {data.images.map((i) => (
          <p key={i.id} className="break-all">
            {i.position}: {i.url}
          </p>
        ))}
        <ActionForm action={saveImage}>
          <input name="productId" type="hidden" value={id} />
          <label className="block">
            Image URL <input name="url" type="url" maxLength={2000} required />
          </label>
          <label className="block">
            Alternative text <input name="alt" maxLength={200} required />
          </label>
          <label className="block">
            Position{" "}
            <input
              name="position"
              type="number"
              min={0}
              max={100}
              defaultValue={0}
              required
            />
          </label>
        </ActionForm>
      </section>
    </div>
  )
}
