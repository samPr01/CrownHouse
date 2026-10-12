"use client"
import { useState } from "react"
import Link from "next/link"
import { Heart, ShoppingBag, User } from "lucide-react"
import Logo from "@/assets/logo/logo"
import { useCart } from "@/components/cart-context"
import { CartSidebar } from "@/components/cart-sidebar"
export type NavigationSection = { title: string; href: string; isActive?: boolean }
export default function Header({ navigationData }: { navigationData: NavigationSection[]; className?: string }) {
  const [cartOpen, setCartOpen] = useState(false)
  const { itemCount } = useCart()
  return <>
    <header className="store-header relative z-30 border-b border-border bg-background">
      <div className="header-shell mx-auto max-w-[1440px] px-5 sm:px-10 lg:px-16">
        <Link href="/" aria-label="CrownHouse homepage"><Logo /></Link>
        <nav aria-label="Main navigation" className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1 text-xs">{navigationData.map(item => <Link key={item.title} href={item.href} className="py-3 text-muted-foreground transition-colors hover:text-foreground">{item.title}</Link>)}</nav>
        <div className="header-actions flex items-center gap-4">
          <Link href="/account" aria-label="Account"><User size={18} strokeWidth={1.4} /></Link>
          <Link href="/wishlist" aria-label="Wishlist" className="hidden sm:block"><Heart size={18} strokeWidth={1.4} /></Link>
          <button onClick={() => setCartOpen(true)} aria-label={`Open shopping bag, ${itemCount} items`} className="flex items-center gap-1.5"><ShoppingBag size={18} strokeWidth={1.4} /><span className="text-xs">({itemCount})</span></button>

        </div>
      </div>

    </header>
    <CartSidebar open={cartOpen} onOpenChange={setCartOpen} />
  </>
}
