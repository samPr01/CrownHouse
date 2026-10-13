"use client"

import { useState } from "react"

export default function OrderItemImage({
  src,
  name,
}: {
  src: string | null
  name: string
}) {
  const [failedSource, setFailedSource] = useState<string | null>(null)
  return (
    <div className="flex h-24 w-20 shrink-0 items-center justify-center overflow-hidden rounded border bg-stone-50">
      {src && failedSource !== src ? (
        // Catalog URLs are external; use the original image without an optimizer allowlist.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={name}
          width={80}
          height={96}
          loading="lazy"
          onError={() => setFailedSource(src)}
          className="h-full w-full object-contain p-1"
        />
      ) : (
        <span className="px-2 text-center text-xs text-stone-600">
          Image unavailable
        </span>
      )}
    </div>
  )
}
