import "./env"
import { createHash } from "node:crypto"
import { inArray, sql } from "drizzle-orm"
import { PRODUCTS } from "../../lib/data"
import { WOMEN_CATEGORIES } from "../../lib/categories"
import { connectDatabase } from "../../lib/db/connection"
import { categories,products,variants,images,inventory } from "../../lib/db/schema"
const {client,db}=connectDatabase(process.env.MIGRATION_DATABASE_URL || "")
const categoryId=(name:string)=>name.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/-$/,'')
try {
  const categoryRows=WOMEN_CATEGORIES.flatMap(group=>group.children.map(name=>({id:categoryId(name),name,department:group.name}))).map((row,position)=>({...row,position}))
  const productRows=PRODUCTS.map(p=>({id:p.id,slug:p.slug,name:p.name,description:p.description,categoryId:categoryId(p.subcategory!),details:p.accordionInfo || []}))
  const variantRows=PRODUCTS.flatMap(p=>(p.sizes || []).map((v,position)=>{
    const id=v.id || `${p.id}-${position}`
    return {id,productId:p.id,name:v.name,sku:`CH-${createHash('sha256').update(id).digest('hex').slice(0,20).toUpperCase()}`,options:v.options || {},priceMinor:Math.round(v.price*100),compareAtMinor:v.originalPrice?Math.round(v.originalPrice*100):null,currency:"INR",position}
  }))
  const imageRows=PRODUCTS.flatMap(p=>[p.image,...(p.details||[])].map((url,position)=>({productId:p.id,url,alt:p.name,position})))
  if(productRows.length!==141 || variantRows.length!==460 || variantRows.some(v=>v.priceMinor<=0 || (v.compareAtMinor!==null && v.compareAtMinor<v.priceMinor))) throw new Error("Catalog validation failed; review import before proceeding")
  await db.transaction(async tx=>{
    await tx.insert(categories).values(categoryRows).onConflictDoUpdate({target:categories.id,set:{name:sql`excluded.name`,department:sql`excluded.department`,position:sql`excluded.position`}})
    await tx.insert(products).values(productRows).onConflictDoUpdate({target:products.id,set:{slug:sql`excluded.slug`,name:sql`excluded.name`,description:sql`excluded.description`,categoryId:sql`excluded.category_id`,details:sql`excluded.details`}})
    await tx.insert(variants).values(variantRows).onConflictDoUpdate({target:variants.id,set:{name:sql`excluded.name`,sku:sql`excluded.sku`,options:sql`excluded.options`,priceMinor:sql`excluded.price_minor`,compareAtMinor:sql`excluded.compare_at_minor`,position:sql`excluded.position`}})
    await tx.insert(inventory).values(variantRows.map(v=>({variantId:v.id,quantity:0,verified:false}))).onConflictDoNothing()
    await tx.delete(images).where(inArray(images.productId,productRows.map(p=>p.id)))
    await tx.insert(images).values(imageRows)
  })
  console.log(`Seeded ${productRows.length} products, ${variantRows.length} variants. Existing inventory preserved.`)
} catch(error) {
  console.error("Seed failed:",(error as {code?:string}).code || "import error")
  process.exitCode=1
} finally {await client.end()}
