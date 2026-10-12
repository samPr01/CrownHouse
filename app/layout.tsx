import { Geist_Mono, Inter } from "next/font/google"
import type { Metadata } from "next"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils"
import { CartProvider } from "@/components/cart-context"
import { WishlistProvider } from "@/components/wishlist-context"
import Header from "@/components/shadcn-space/blocks/hero-01/header"
import Footer from "@/components/shadcn-space/blocks/footer-01/footer"
import { AnnouncementBar } from "@/components/announcement-bar"

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL || "http://localhost:3003"),
  title: "CrownHouse | Simply Beyond",
  description:
    "CrownHouse — Simply Beyond. Discover considered fashion clothing for women.",
  icons: { icon: "/brand/crownhouse-monogram.jpeg" },
  keywords:
    "CrownHouse, Simply Beyond, womenswear, women empowerment, clothing",
  openGraph: {
    title: "CrownHouse | Simply Beyond",
    description:
      "Simply Beyond. Explore the CrownHouse clothing edit for women.",
    type: "website",
    locale: "en_US",
  },
}

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontMono.variable,
        "font-sans",
        inter.variable
      )}
    >
      <body>
        <ThemeProvider>
          <CartProvider>
            <WishlistProvider>
              <div className="flex min-h-screen flex-col">
                <AnnouncementBar />
                <Header
                  navigationData={[
                    { title: "Home", href: "/" },
                    { title: "Shop", href: "/shop" },
                    { title: "About", href: "/about" },
                    { title: "Contact", href: "/contact" },
                  ]}
                />
                <div className="flex-1">{children}</div>
                <Footer />
              </div>
            </WishlistProvider>
          </CartProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
