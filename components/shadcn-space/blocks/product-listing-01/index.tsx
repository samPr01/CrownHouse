"use client"

import { ArrowUpRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import Link from "next/link"
import {
  ProductCard,
  type ProductCardProps,
} from "@/components/shadcn-space/blocks/product-listing-01/product-card"

export interface ProductListingProps {
  collectionHref?: string
  products?: ProductCardProps[]
  title?: string
  description?: string
}

export default function ProductListing({
  collectionHref = "/shop",
  products = [],
  title = "The CrownHouse Edit",
  description = "Considered clothing. Effortless expression. Simply Beyond.",
}: ProductListingProps) {
  return (
    <section className="py-12 md:py-16">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-8 px-5 sm:px-10 lg:px-16">
        <div className="flex flex-col items-center justify-between gap-5 text-center sm:flex-row sm:text-left">
          <div className="flex flex-col gap-1">
            <h2 className="text-3xl font-normal tracking-tight text-foreground">{title}</h2>
            <p className="text-base leading-7 text-muted-foreground">{description}</p>
          </div>
          <Link href={collectionHref}>
            <Button
              className={cn(
                "group relative h-10 w-fit overflow-hidden rounded-full p-1 ps-4 pe-12 text-sm font-medium transition-all duration-500 hover:ps-12 hover:pe-4",
                "cursor-pointer"
              )}
            >
              <span className="relative z-10 transition-all duration-500">
                See all
              </span>
              <span className="absolute right-1 flex h-8 w-8 items-center justify-center rounded-full bg-background text-foreground transition-all duration-500 group-hover:right-[calc(100%-36px)] group-hover:rotate-45">
                <ArrowUpRight size={16} />
              </span>
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-4">
          {products.map((product, index) => (
            <div key={index} className="w-full">
              <ProductCard {...product} className="h-full w-full" />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
