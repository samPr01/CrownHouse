import type { Metadata } from "next"
import Link from "next/link"
import AgencyHeroSection from "@/components/shadcn-space/blocks/hero-01/index"
import ProductListing from "@/components/shadcn-space/blocks/product-listing-01/index"
import { getProducts } from "@/lib/server/catalog"
export const dynamic = "force-dynamic"
import { WOMEN_CATEGORIES, womenCategoryUrl } from "@/lib/categories"
export const metadata: Metadata = { title: "CrownHouse | Simply Beyond", description: "Considered clothing for women. Explore the CrownHouse edit. Simply Beyond." }
export default async function Page() {
  const PRODUCTS = await getProducts()
  return <main><AgencyHeroSection />{WOMEN_CATEGORIES.flatMap(group => group.children.map(child => <ProductListing key={child} products={PRODUCTS.filter(product => product.subcategory === child).slice(0, 4)} title={child} description="Choose what feels like you. Simply Beyond." collectionHref={womenCategoryUrl(group.name)} />))}
    <section className="mx-auto max-w-[1440px] px-5 py-16 sm:px-10 lg:px-16"><div className="grid gap-8 text-center sm:text-left border-y border-border py-14 sm:grid-cols-2"><p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">The CrownHouse point of view</p><div><h2 className="mx-auto max-w-lg text-3xl sm:mx-0 font-normal leading-tight tracking-tight sm:text-4xl">Your voice. Your choices.<br />Your kind of style.</h2><p className="mt-5 mx-auto max-w-lg text-base sm:mx-0 leading-7 text-muted-foreground">We believe women deserve the freedom to define themselves. Express yourself on your own terms, with clothing that makes space for who you are and who you are becoming.</p><Link href="/about" className="mt-6 inline-block border-b border-foreground pb-1 text-xs">Our story</Link></div></div></section>
  </main>
}
