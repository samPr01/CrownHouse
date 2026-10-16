import Link from "next/link"
export default function PolicyPage({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <main className="mx-auto max-w-3xl space-y-6 px-5 py-16 text-center [&_h2]:text-2xl [&_p]:leading-7">
      <h1 className="text-4xl">{title}</h1>
      {children}
      <p>
        Questions?{" "}
        <a href="mailto:hello@crownhouse.in" className="underline">
          hello@crownhouse.in
        </a>{" "}
        ·{" "}
        <a href="tel:+919232133533" className="underline">
          +91 92321 33533
        </a>
      </p>
      <p>213, Diamond Trade Centre, New Palasia, Indore 452001, MP, India.</p>
      <nav className="flex flex-wrap justify-center gap-5 underline">
        <Link href="/privacy">Privacy</Link>
        <Link href="/terms">Terms</Link>
        <Link href="/shipping">Shipping</Link>
        <Link href="/returns">Returns</Link>
      </nav>
    </main>
  )
}
