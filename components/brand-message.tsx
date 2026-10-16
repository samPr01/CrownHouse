import type { ReactNode } from "react"

export default function BrandMessage({ children }: { children: ReactNode }) {
  return (
    <div className="w-fit max-w-sm rounded-xl border border-stone-200 bg-card px-4 py-3 text-center shadow-sm motion-safe:animate-[brand-message-in_700ms_ease-out_both]">
      <p className="text-base leading-6 text-stone-700">{children}</p>
    </div>
  )
}
