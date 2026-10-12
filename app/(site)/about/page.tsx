import type { Metadata } from "next"

import Link from "next/link"

export const metadata: Metadata = { title: "Our story | CrownHouse", description: "Women’s clothing centered on self-expression, equality, and the freedom to choose. Simply Beyond." }

const values = [



  { title: "Confidence, self-defined", text: "Dress up, dress down, take up space. Your worth is never measured by an outfit, a size, or someone else’s approval." },

  { title: "Beyond expectations", text: "From everyday clothing to ethnic wear, our edit invites you to explore your style without letting convention write your story." },

]

export default function AboutPage() { return <main className="mx-auto max-w-[1200px] px-5 py-16 sm:px-10 lg:px-16"><p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">The CrownHouse point of view</p><h1 className="mt-6 max-w-3xl text-5xl font-normal tracking-tight sm:text-7xl">A wardrobe.<br />A world of possibilities.</h1><p className="mt-8 max-w-2xl text-base leading-8 text-muted-foreground">CrownHouse is a women’s clothing store with a simple belief: every woman deserves the freedom to be herself. Simply Beyond is our invitation to move beyond expectations and define style on your own terms.</p><section className="my-16 grid gap-10 border-y border-border py-12 sm:grid-cols-2">{values.map(value => <div key={value.title}><h2 className="text-2xl tracking-tight">{value.title}</h2><p className="mt-4 text-sm leading-7 text-muted-foreground">{value.text}</p></div>)}</section><h2 className="text-3xl tracking-tight">Wear what feels like you.</h2><Link href="/shop" className="mt-6 inline-block border-b border-foreground pb-2 text-sm">Explore the collection</Link></main> }

