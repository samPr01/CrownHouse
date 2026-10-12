"use server"
import { headers } from "next/headers"
import { z } from "zod"
import { withDatabase } from "@/lib/db/client"
import { contactMessages } from "@/lib/db/schema"
import { rateLimit } from "@/lib/server/rate-limit"
import type { FormResult } from "@/components/action-form"
export async function sendContact(
  _state: FormResult,
  form: FormData
): Promise<FormResult> {
  if (form.get("website")) return { message: "Your message has been received." }
  const parsed = z
    .object({
      name: z.string().trim().min(2).max(120),
      email: z
        .email()
        .max(254)
        .transform((v) => v.toLowerCase()),
      message: z.string().trim().min(10).max(4000),
    })
    .safeParse({
      name: form.get("name"),
      email: form.get("email"),
      message: form.get("message"),
    })
  if (!parsed.success)
    return {
      error:
        "Enter your name, valid email and a message of 10–4,000 characters.",
    }
  try {
    const h = await headers()
    const origin = process.env.APP_URL && new URL(process.env.APP_URL).origin
    if (!origin || h.get("origin") !== origin)
      return { error: "Please submit from the store website." }
    if (
      !(await rateLimit("contact", parsed.data.email, 3, 3600)) ||
      !(await rateLimit("contact-global", "all", 100, 3600))
    )
      return {
        error: "Message limit reached. Please contact us by phone or email.",
      }
    await withDatabase((tx) => tx.insert(contactMessages).values(parsed.data))
    return {
      message:
        "Your message has been saved for our store team. For urgent questions, call +91 76160 21755.",
    }
  } catch {
    return {
      error:
        "Unable to save your message. Please email Ecomcrownsolutions@gmail.com or call +91 76160 21755.",
    }
  }
}
