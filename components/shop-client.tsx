"use client"

import { Suspense, useState } from "react"
import BrandMessage from "@/components/brand-message"

import { useSearchParams } from "next/navigation"

import Link from "next/link"

import { Search, SlidersHorizontal } from "lucide-react"

import { WOMEN_CATEGORIES, womenCategoryUrl } from "@/lib/categories"

import type { Product } from "@/lib/data"

import { ProductCard } from "@/components/shadcn-space/blocks/product-listing-01/product-card"

function ShopContent({ products: PRODUCTS }: { products: Product[] }) {
  const params = useSearchParams()

  const urlCategory = "Women"

  const [selection, setSelection] = useState({
    url: urlCategory,
    category: urlCategory,
  })

  const category =
    selection.url === urlCategory ? selection.category : urlCategory

  const department = params.get("department") || ""

  const subcategory = params.get("subcategory") || ""

  const [pageState, setPageState] = useState({ key: "", page: 1 })

  const [search, setSearch] = useState("")

  const [sort, setSort] = useState("featured")

  const [size, setSize] = useState("")

  const [under150, setUnder150] = useState(false)

  const [filtersOpen, setFiltersOpen] = useState(false)

  const filtered = PRODUCTS.filter(
    (p) =>
      (category === "All" || p.category === category) &&
      p.name.toLowerCase().includes(search.toLowerCase()) &&
      (!size ||
        p.sizes?.some(
          (v) =>
            (v.options?.Size === size ||
              v.options?.size === size ||
              v.name === size) &&
            !v.outOfStock
        )) &&
      (!under150 || p.price < 1000) &&
      (category !== "Women" || !department || p.department === department) &&
      (category !== "Women" || !subcategory || p.subcategory === subcategory)
  ).sort((a, b) =>
    sort === "price-asc"
      ? a.price - b.price
      : sort === "price-desc"
        ? b.price - a.price
        : 0
  )

  const filterKey = JSON.stringify([
    category,
    department,
    subcategory,
    search,
    sort,
    size,
    under150,
  ])

  const page = pageState.key === filterKey ? pageState.page : 1

  const pageCount = Math.ceil(filtered.length / 24)

  const visibleProducts = filtered.slice((page - 1) * 24, page * 24)

  function reset() {
    setSelection({ url: urlCategory, category: "All" })
    setSize("")
    setUnder150(false)
    setSearch("")
  }

  return (
    <main className="mx-auto max-w-[1440px] px-5 py-10 sm:px-10 lg:px-16">
      <div className="mb-10 text-xs text-muted-foreground">
        <Link href="/">Home</Link>
        <span className="mx-3">/</span>Shop collection
      </div>

      <div className="mb-12 flex flex-col items-center justify-between gap-5 text-center sm:flex-row sm:items-end sm:items-start sm:text-left">
        <div>
          <p className="mb-3 text-xs tracking-[0.2em] text-muted-foreground uppercase">
            Simply Beyond
          </p>
          <h1 className="text-4xl font-normal tracking-[-0.045em] sm:text-5xl">
            {category === "Women" && subcategory
              ? subcategory
              : category === "Women" && department
                ? department
                : "Shop collection"}
          </h1>
        </div>
        <BrandMessage>
          Your style. Your choice.
          <br />
          Dress for yourself.
        </BrandMessage>
      </div>

      {category === "Women" && (
        <nav
          aria-label="Shop departments"
          className="mb-8 flex flex-wrap justify-center gap-x-7 gap-y-3 border-y border-border py-4 sm:justify-start"
        >
          {WOMEN_CATEGORIES.map((group) => (
            <Link
              key={group.name}
              href={womenCategoryUrl(group.name)}
              className={`text-xs ${department === group.name ? "font-semibold underline underline-offset-4" : "text-muted-foreground"}`}
            >
              {group.name}
            </Link>
          ))}
          <Link href="/shop" className="text-xs text-muted-foreground">
            View all products
          </Link>
        </nav>
      )}

      <div className="grid gap-8 lg:grid-cols-[180px_1fr] lg:gap-12">
        <div>
          <button
            onClick={() => setFiltersOpen(!filtersOpen)}
            aria-expanded={filtersOpen}
            className="mb-5 flex items-center gap-2 text-xs lg:hidden"
          >
            <SlidersHorizontal size={15} />
            Filters
          </button>
          <aside
            aria-label="Product filters"
            className={`${filtersOpen ? "block" : "hidden"} space-y-8 lg:block`}
          >
            {(category === "Women" || category === "All") && (
              <div className="space-y-6 border-t border-border pt-6">
                {WOMEN_CATEGORIES.map((group) => (
                  <div key={group.name}>
                    <Link
                      href={womenCategoryUrl(group.name)}
                      className="text-xs font-medium"
                    >
                      {group.name}
                    </Link>
                    <div className="mt-3 flex flex-col items-start gap-3">
                      {group.children.map((child) => (
                        <Link
                          key={child}
                          href={womenCategoryUrl(group.name, child)}
                          className={`text-sm ${subcategory === child && category === "Women" ? "font-semibold underline underline-offset-4" : "text-muted-foreground"}`}
                        >
                          {child}
                          <span className="ml-1.5 text-xs">
                            (
                            {
                              PRODUCTS.filter(
                                (p) =>
                                  p.category === "Women" &&
                                  p.subcategory === child
                              ).length
                            }
                            )
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="border-t border-border pt-6">
              <h2 className="mb-4 text-xs font-medium">Size</h2>
              <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
                {[
                  "XS",
                  "S",
                  "M",
                  "L",
                  "XL",
                  "XXL",
                  "XXXL",
                  "6",
                  "7",
                  "8",
                  "9",
                  "10",
                  "One Size",
                ].map((value) => (
                  <button
                    key={value}
                    aria-pressed={size === value}
                    onClick={() => setSize(size === value ? "" : value)}
                    className={`min-w-9 border px-2 py-2 text-xs ${size === value ? "border-foreground bg-foreground text-background" : "border-border"}`}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-border pt-6">
              <h2 className="mb-4 text-xs font-medium">Price</h2>
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={under150}
                  onChange={(e) => setUnder150(e.target.checked)}
                  className="accent-black"
                />
                Under INR 1,000
              </label>
            </div>

            <Link
              href="/shop?category=Women"
              onClick={reset}
              className="text-xs text-muted-foreground underline underline-offset-4"
            >
              Clear filters
            </Link>
          </aside>
        </div>

        <section aria-label="Clothing results">
          <div className="mb-6 flex flex-wrap items-center justify-end gap-4 border-b border-border pb-5">
            <div className="flex flex-wrap items-center gap-5">
              <label className="flex items-center gap-2">
                <Search size={14} />
                <input
                  aria-label="Search clothing"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search clothing"
                  className="w-28 bg-transparent py-1 text-xs outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </label>
              <select
                aria-label="Sort products"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="bg-background py-1 text-xs"
              >
                <option value="featured">Featured</option>
                <option value="price-asc">Price: low to high</option>
                <option value="price-desc">Price: high to low</option>
              </select>
            </div>
          </div>

          {filtered.length ? (
            <div className="grid grid-cols-2 gap-x-4 gap-y-8 xl:grid-cols-3 xl:gap-x-6">
              {visibleProducts.map((product) => (
                <ProductCard key={product.id} {...product} />
              ))}
            </div>
          ) : (
            <div className="py-24 text-center">
              <p className="text-sm text-muted-foreground">
                No styles match your filters.
              </p>
              <button
                onClick={reset}
                className="mt-4 border-b border-foreground text-xs"
              >
                View all clothing
              </button>
            </div>
          )}

          {pageCount > 1 && (
            <nav
              aria-label="Product pages"
              className="mt-10 flex items-center justify-between border-t border-border pt-5 text-xs"
            >
              <button
                disabled={page === 1}
                onClick={() => setPageState({ key: filterKey, page: page - 1 })}
                className="px-3 py-2 disabled:opacity-30"
              >
                Previous
              </button>
              <span>
                Page {page} of {pageCount}
              </span>
              <button
                disabled={page === pageCount}
                onClick={() => setPageState({ key: filterKey, page: page + 1 })}
                className="px-3 py-2 disabled:opacity-30"
              >
                Next
              </button>
            </nav>
          )}
        </section>
      </div>
    </main>
  )
}

export default function ShopClient({ products }: { products: Product[] }) {
  return (
    <Suspense
      fallback={<div className="p-12 text-center">Loading collection...</div>}
    >
      <ShopContent products={products} />
    </Suspense>
  )
}
