import { z } from "zod"
export const emailInput=z.email().max(254).transform(v=>v.trim().toLowerCase())
export const passwordInput=z.string().min(10,"Use at least ten characters.").max(128)
export const profileInput=z.object({name:z.string().trim().min(2).max(120),phone:z.string().trim().regex(/^\+?[0-9]{10,15}$/)})
export const addressInput=z.object({line1:z.string().trim().min(5).max(200),line2:z.string().trim().max(200).default(""),
  city:z.string().trim().min(2).max(100),state:z.string().trim().min(2).max(100),postalCode:z.string().regex(/^[1-9][0-9]{5}$/),country:z.literal("IN")})
export function safeAuthNext(value:unknown) {
  return value==="/checkout" || value==="/account" || value==="/admin" || value==="/reset-password" ? value : "/account"
}
