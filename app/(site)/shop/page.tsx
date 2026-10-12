import ShopClient from "@/components/shop-client"
import { getProducts } from "@/lib/server/catalog"
export const dynamic = "force-dynamic"
export default async function ShopPage() {
  return <ShopClient products={await getProducts()} />
}
