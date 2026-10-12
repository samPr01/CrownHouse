import Link from "next/link"

import { getProducts } from "@/lib/server/catalog"

import { ArrowUpRight } from "lucide-react"

export default async function HeroSection() {
  const PRODUCTS = await getProducts()

  return <section className="mx-auto max-w-[1440px] px-5 pb-12 pt-14 sm:px-10 lg:px-16 lg:pt-20">

    <div className="mb-10 flex flex-col items-center justify-between gap-6 text-center md:flex-row md:items-end md:text-left">

      <div><p className="mb-5 text-xs uppercase tracking-[0.22em] text-muted-foreground">For women. On your terms.</p><h1 className="text-5xl font-normal leading-[1.05] tracking-[-0.055em] sm:text-7xl">Simply Beyond.</h1></div>

      <p className="max-w-md text-base leading-6 text-muted-foreground">Beyond expectations. Beyond anyone else’s rules. Clothing for women who define themselves.</p>

    </div>

    <div className="grid gap-4 sm:grid-cols-2">

      {[{ name: "Everyday, your way", department: "Clothing", subcategory: "Shirts", caption: "Confidence belongs to you." }, { name: "Rooted. Unrestricted.", department: "Ethnics", subcategory: "Kurti", caption: "Tradition, with your own voice." }].map((edit, i) => <Link key={edit.name} href={`/shop?category=Women&department=${edit.department}`} className="group relative block aspect-[4/3] overflow-hidden bg-muted sm:aspect-[5/4]">

        <img src={PRODUCTS.find(p => p.subcategory === edit.subcategory)?.image} alt={`${edit.department} for women`} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" fetchPriority={i === 0 ? "high" : "auto"} />

        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-black/60 to-transparent p-6 pt-20 text-white"><div><p className="text-xs uppercase tracking-[0.15em] opacity-80">{edit.caption}</p><h2 className="mt-2 text-3xl font-normal tracking-tight">{edit.name}</h2></div><ArrowUpRight size={22} strokeWidth={1.3} /></div>

      </Link>)}

    </div>

  </section>

}

