import Link from "next/link"
export default function PolicyPage({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <main className="mx-auto max-w-3xl space-y-6 px-5 py-16 [&_h2]:text-2xl [&_p]:leading-7">
      <h1 className="text-4xl">{title}</h1>
      {children}
      <p>
        Questions?{" "}
        <a href="mailto:Ecomcrownsolutions@gmail.com" className="underline">
          Ecomcrownsolutions@gmail.com
        </a>{" "}
        ·{" "}
        <a href="tel:+917616021755" className="underline">
          +91 76160 21755
        </a>
      </p>
      <p>213, Diamond Trade Centre, New Palasia, Indore 452001, MP, India.</p>
      <nav className="flex flex-wrap gap-5 underline">
        <Link href="/privacy">Privacy</Link>
        <Link href="/terms">Terms</Link>
        <Link href="/shipping">Shipping</Link>
        <Link href="/returns">Returns</Link>
      </nav>
    </main>
  )
}
