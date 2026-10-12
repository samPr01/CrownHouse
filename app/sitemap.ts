import type { MetadataRoute } from "next"
import { getProducts } from "@/lib/server/catalog"
export const dynamic = "force-dynamic"
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.APP_URL || "http://localhost:3003"
  return [
    ...[
      "",
      "/shop",
      "/about",
      "/contact",
      "/faq",
      "/privacy",
      "/terms",
      "/shipping",
      "/returns",
    ].map((path) => ({ url: `${base}${path}` })),
    ...(await getProducts()).map((p) => ({ url: `${base}/shop/${p.slug}` })),
  ]
}
