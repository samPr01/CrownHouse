import ProductOverview from "@/components/shadcn-space/blocks/product-overview-04/product-overview"
import ProductListing from "@/components/shadcn-space/blocks/product-listing-01/index"
import { getProducts, getProduct } from "@/lib/server/catalog"
export const dynamic = "force-dynamic"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { Instrument_Serif } from "next/font/google"
import { Star, ShieldCheck, Leaf, Globe, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: ["400"],
  style: ["italic"],
})

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const product = await getProduct(slug)

  if (!product) {
    return {
      title: "Product Not Found | CrownHouse",
    }
  }

  return {
    title: `${product.name} | CrownHouse`,
    description: product.description.slice(0,200),
    alternates: { canonical: `/shop/${product.slug}` },
  }
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params
  const product = await getProduct(slug)

  if (!product) {
    notFound()
  }

  const overviewData = {
    id: product.id,
    slug: product.slug,
    brand: product.brand || "CROWNHOUSE",
    title: product.name,
    rating: product.rating,
    reviewCount: product.reviews,
    description: product.description,
    discount: product.discount,
    originalPrice: product.originalPrice,
    sizes: product.sizes || [{ name: "Standard", price: product.price }],
    images: {
      main: product.image,
      details: product.details || [],
    },
    accordionInfo: product.accordionInfo?.length ? product.accordionInfo : [
      {
        title: "Material & Care",
        content:
          "Please refer to the product description and garment label for material, fit and care details. Contact us if you need measurements before ordering.",
      },
      {
        title: "Shipping & Returns",
        content:
          "Cash on delivery only. Shipping is ₹99 below ₹599 and free from ₹599. Contact the store for delivery timing and returns eligibility.",
      },
    ],
  }

  return (
    <main className="bg-background">
      <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify({"@context":"https://schema.org","@type":"Product",name:product.name,description:product.description,image:[product.image,...(product.details||[])].filter(Boolean),brand:{"@type":"Brand",name:"CrownHouse"},offers:{"@type":"AggregateOffer",priceCurrency:"INR",lowPrice:product.price,highPrice:Math.max(product.price,...(product.sizes||[]).map(s=>s.price)),offerCount:product.sizes?.length||1,url:`${process.env.APP_URL}/shop/${product.slug}`}}).replace(/</g,"\\u003c")}}/>
      <div className="pt-20">
        <ProductOverview product={overviewData} />

        <div className="border-t py-12">
          <ProductListing
            title="Related Products"
            description="You might also like these curated pieces"
            products={(await getProducts()).filter((p) => p.slug !== slug).slice(0, 4)}
          />
        </div>
        {/* Cinematic Lifestyle Showcase */}
        <section className="overflow-hidden px-4 py-24">
          <div className="mx-auto max-w-7xl">
            <div className="group relative aspect-[21/9] overflow-hidden rounded-[2rem]">
              <img
                src="/assets/product/lifestyle.png"
                alt="Lifestyle Showcase"
                className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-105"
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/20 p-8 text-center text-white">
                <h2
                  className={cn(
                    "mb-4 max-w-3xl text-4xl md:text-7xl",
                    instrumentSerif.className
                  )}
                >
                  Designed for the <span className="italic">intentional</span>{" "}
                  life.
                </h2>
                <p className="text-sm font-light tracking-[0.2em] uppercase opacity-90 md:text-base">
                  The CrownHouse Signature Series
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
