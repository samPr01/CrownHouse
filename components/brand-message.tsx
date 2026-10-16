import type { ReactNode } from "react"

export default function BrandMessage({ children }: { children: ReactNode }) {
  return (
    <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-card px-6 py-5 text-center shadow-sm motion-safe:animate-[brand-message-in_700ms_ease-out_both]">
      <span
        aria-hidden="true"
        className="mx-auto mb-3 block h-px w-10 bg-stone-400"
      />
      <p className="text-base leading-7 text-stone-700">{children}</p>
    </div>
  )
}
