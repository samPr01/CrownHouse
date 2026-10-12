import Link from "next/link"
import ActionForm from "@/components/action-form"
import {sendContact} from "@/app/contact-actions"
export default function ContactForm() {
  return <section className="w-full border p-6 sm:p-8"><h2 className="mb-6 text-2xl">Get in touch</h2><ActionForm action={sendContact} label="Send message"><label className="block">Full name <input name="name" autoComplete="name" className="mt-2 w-full" minLength={2} maxLength={120} required/></label><label className="block">Email <input name="email" type="email" autoComplete="email" className="mt-2 w-full" maxLength={254} required/></label><label className="block">Message<textarea name="message" rows={5} minLength={10} maxLength={4000} required/></label><div className="hidden" aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off"/></label></div><p className="text-sm">We use your details to respond to this inquiry. Read our <Link className="underline" href="/privacy">privacy notice</Link>.</p></ActionForm></section>
}
