import "server-only"
import { cache } from "react"
import { asc, eq } from "drizzle-orm"
import { withDatabase } from "../db/client"
import { products, variants, images, categories, inventory } from "../db/schema"
import type { Product } from "../data"

// Only public catalog fields leave the server; supplier metadata is never selected.
export const getProducts = cache(async (): Promise<Product[]> => withDatabase(async tx => {
  const rows = await tx.select({product:products, category:categories}).from(products)
    .innerJoin(categories,eq(products.categoryId,categories.id)).where(eq(products.active,true))
    .orderBy(asc(categories.position),asc(products.slug))
  const variantRows = await tx.select({variant:variants,stock:inventory}).from(variants)
    .leftJoin(inventory,eq(variants.id,inventory.variantId)).where(eq(variants.active,true)).orderBy(asc(variants.position))
  const imageRows = await tx.select().from(images).orderBy(asc(images.position))
  return rows.map(({product:p,category:c}) => {
    const sizes = variantRows.filter(v=>v.variant.productId===p.id).map(({variant:v,stock})=>({
      id:v.id,name:v.name,options:v.options,sku:v.sku,price:v.priceMinor/100,
      originalPrice:v.compareAtMinor ? v.compareAtMinor/100 : undefined,
      // Unknown inventory must not be presented as confirmed availability.
      outOfStock: !stock?.verified || stock.quantity < 1,
    }))
    const pictures=imageRows.filter(i=>i.productId===p.id)
    const lowest=sizes.reduce((a,b)=>a.price<=b.price?a:b,sizes[0])
    return {id:p.id,slug:p.slug,name:p.name,description:p.description,category:"Women",department:c.department,
      subcategory:c.name,currency:"INR",price:lowest?.price || 0,originalPrice:lowest?.originalPrice,
      image:pictures[0]?.url || "",details:pictures.slice(1).map(i=>i.url),sizes,accordionInfo:p.details,rating:0,reviews:0}
  }).filter(p=>p.sizes.length>0)
}))
export const getProduct = cache(async (slug:string) => (await getProducts()).find(p=>p.slug===slug))
