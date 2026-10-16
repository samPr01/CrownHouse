import Link from "next/link"

import Logo from "@/assets/logo/logo"

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-border">
      <div className="mx-auto grid max-w-[1440px] gap-10 px-5 py-14 text-center sm:grid-cols-2 sm:px-10 sm:text-left lg:grid-cols-[2fr_1fr_1fr] lg:px-16">
        <div>
          <Link href="/">
            <Logo monogram />
          </Link>
          <p className="mx-auto mt-5 max-w-xs text-base leading-6 text-muted-foreground sm:mx-0">
            Women’s clothing. Freedom to be yourself.
            <br />
            Simply Beyond.
          </p>
        </div>

        <div>
          <h2 className="mb-5 text-xs tracking-[0.18em] uppercase">Explore</h2>
          <div className="flex flex-col items-center gap-3 text-base text-muted-foreground sm:items-start">
            <Link href="/shop?category=Women&department=Ethnics">Ethnics</Link>
            <Link href="/shop">All clothing</Link>
            <Link href="/about">Our story</Link>
          </div>
        </div>

        <div>
          <h2 className="mb-5 text-xs tracking-[0.18em] uppercase">
            Here to help
          </h2>
          <div className="flex flex-col items-center gap-3 text-base text-muted-foreground sm:items-start">
            <Link href="/contact">Contact</Link>
            <Link href="/faq">FAQs</Link>
            <Link href="/account">My account</Link>
            <Link href="/wishlist">Wishlist</Link>
          </div>
        </div>
      </div>

      <nav
        aria-label="Store policies"
        className="mx-auto flex max-w-[1440px] flex-wrap justify-center gap-5 px-5 pb-6 text-sm underline"
      >
        <Link href="/privacy">Privacy</Link>
        <Link href="/terms">Terms</Link>
        <Link href="/shipping">Shipping</Link>
        <Link href="/returns">Returns</Link>
      </nav>
      <div className="mx-auto flex max-w-[1440px] flex-col items-center justify-between gap-4 border-t border-border px-5 py-5 text-center text-sm leading-6 text-muted-foreground sm:flex-row sm:px-10 sm:text-left lg:px-16">
        <span>
          &copy; 2026 CrownHouse Owned &amp; Managed by ECOMCROWN SOLUTIONS
          (OPC) PVT. LTD
        </span>
        <span className="shrink-0">Simply Beyond.</span>
      </div>
    </footer>
  )
}
