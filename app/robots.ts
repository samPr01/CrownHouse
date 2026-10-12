import type { MetadataRoute } from "next"
export default function robots(): MetadataRoute.Robots {
  const base = process.env.APP_URL || "http://localhost:3003"
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/account",
        "/checkout",
        "/api/",
        "/auth/",
        "/reset-password",
        "/login",
        "/register",
        "/forgot-password",
      ],
    },
    sitemap: `${base}/sitemap.xml`,
  }
}
