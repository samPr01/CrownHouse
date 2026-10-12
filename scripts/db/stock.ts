import "./env"
import { eq, asc, sql } from "drizzle-orm"
import { connectDatabase } from "../../lib/db/connection"
import { products, variants, inventory, inventoryAdjustments, adminAuditLogs, orders } from "../../lib/db/schema"
const {client,db}=connectDatabase(process.env.MIGRATION_DATABASE_URL || "")
try {
  await db.transaction(async tx=>{
    const [done]=await tx.select().from(adminAuditLogs).where(eq(adminAuditLogs.action,"initial_stock_25_per_product"))
    if(done) {console.log("Initial stock already configured; no stock changed.");return}
    if((await tx.select().from(orders).limit(1)).length) throw new Error("Orders exist; use inventory adjustments instead")
    if((await tx.select().from(inventory).where(eq(inventory.verified,true)).limit(1)).length) throw new Error("Stock already verified; refusing to overwrite")
    const catalog=await tx.select().from(products)
    const options=await tx.select().from(variants).orderBy(asc(variants.position),asc(variants.id))
    const stocks: {variantId:string;quantity:number;verified:boolean}[]=[]
    const adjustments: {variantId:string;delta:number;reason:string}[]=[]
    for(const product of catalog) {
      const sizes=options.filter(v=>v.productId===product.id)
      if(!sizes.length) throw new Error("Product has no variants")
      for(const [index,variant] of sizes.entries()) {
        const quantity=Math.floor(25/sizes.length)+(index<25%sizes.length?1:0)
        stocks.push({variantId:variant.id,quantity,verified:true})
        adjustments.push({variantId:variant.id,delta:quantity,reason:"Initial quantity specified by store owner: 25 total per product"})
      }
    }
    await tx.insert(inventory).values(stocks).onConflictDoUpdate({target:inventory.variantId,set:{quantity:sql`excluded.quantity`,verified:true}})
    await tx.insert(inventoryAdjustments).values(adjustments)
    await tx.insert(adminAuditLogs).values({action:"initial_stock_25_per_product",entityId:"catalog",changes:{products:catalog.length,totalUnits:catalog.length*25,source:"owner specified",distribution:"evenly across variants"}})
    console.log(`Initial stock configured: ${catalog.length} products, ${catalog.length*25} pieces total.`)
  })
} catch(error) {console.error("Stock setup failed:",error instanceof Error && !('query' in error)?error.message:"database operation failed");process.exitCode=1}
finally {await client.end()}
