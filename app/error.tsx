"use client"
import { useEffect } from "react"
export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Store page failed", error.digest || "client")
  }, [error])
  return (
    <main className="mx-auto max-w-lg space-y-5 px-5 py-20 text-center">
      <h1 className="text-3xl">We couldn’t load this page</h1>
      <p>
        Please try again. If you already submitted an order, check your account
        or contact the store before placing it again.
      </p>
      <button onClick={reset} className="border px-5 py-3">
        Try again
      </button>
      <p>
        <a href="tel:+917616021755">+91 76160 21755</a>
      </p>
    </main>
  )
}
