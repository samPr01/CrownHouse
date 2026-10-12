import { cn } from "@/lib/utils"
export default function Logo({ className, monogram = false }: { className?: string; monogram?: boolean }) {
 return <span className={cn(monogram ? "brand-monogram" : "brand-wordmark", className)}><img src={monogram ? "/brand/crownhouse-monogram.jpeg" : "/brand/crownhouse-wordmark.jpeg"} alt="CrownHouse - Simply Beyond" /></span>
}
