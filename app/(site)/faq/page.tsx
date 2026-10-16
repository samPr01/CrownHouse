import Link from "next/link"
export const metadata = { title: "Help & FAQs | CrownHouse" }
const questions = [
  [
    "How can I pay?",
    "We currently accept cash on delivery only. No card, UPI or online payment is collected by this website.",
  ],
  [
    "What does delivery cost?",
    "Delivery is ₹99 for orders below ₹599 and free from ₹599. The checkout displays the final amount due on delivery.",
  ],
  [
    "Where do you deliver?",
    "Checkout currently accepts Indian addresses only. Contact the store to confirm delivery availability and timing for your PIN code; international and express shipping are not offered here.",
  ],
  [
    "How do I track or cancel an order?",
    "Sign in to view orders placed through your account. Tracking appears after dispatch. Unshipped, unpaid account orders can be cancelled from their order page. For guest orders, contact us with your order reference.",
  ],
  [
    "Can I return an order?",
    "Contact the store to confirm eligibility and instructions. Account holders can submit a full-order return request after delivery. Do not send items back before approval. Partial returns and refund arrangements are handled with the store.",
  ],
  [
    "Will I receive an email?",
    "Automated order emails are not activated yet. Save the confirmation reference and check your account for orders placed while signed in. Contact us if you need assistance.",
  ],
]
export default function FAQPage() {
  return (
    <main className="mx-auto max-w-3xl space-y-8 px-5 py-16">
      <h1 className="text-4xl">How can we help?</h1>
      {questions.map(([q, a]) => (
        <details key={q} className="border p-5">
          <summary className="text-xl">{q}</summary>
          <p className="mt-4 leading-7">{a}</p>
        </details>
      ))}
      <p>
        <Link className="underline" href="/contact">
          Contact our store
        </Link>{" "}
        ·{" "}
        <a className="underline" href="mailto:hello@crownhouse.in">
          hello@crownhouse.in
        </a>{" "}
        ·{" "}
        <a href="tel:+919232133533" className="underline">
          +91 92321 33533
        </a>
      </p>
    </main>
  )
}
