import "./db/env"
const required = [
  "DATABASE_URL",
  "APP_URL",
  "ADMIN_EMAILS",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
]
let failed = false
for (const name of required) {
  const present = Boolean(process.env[name])
  console.log(`${name}: ${present ? "configured" : "MISSING"}`)
  if (!present) failed = true
}
if (!process.env.RATE_LIMIT_SECRET && !process.env.CRON_SECRET) {
  console.log("Rate-limit secret: MISSING")
  failed = true
}
try {
  if (new URL(process.env.DATABASE_URL || "").username.startsWith("postgres")) {
    console.log("Restricted runtime DATABASE_URL: MISSING")
    failed = true
  }
} catch {
  failed = true
}
const app = process.env.APP_URL || ""
if (!app.startsWith("https://")) {
  console.log(
    "Production HTTPS APP_URL: MISSING (local development URL is not a deployment)"
  )
  failed = true
}
if (process.env.CHECKOUT_MODE !== "cod") {
  console.log("COD checkout: not enabled")
  failed = true
}
console.log(
  `Order emails: ${process.env.RESEND_API_KEY && process.env.ORDER_EMAIL_FROM ? "configured; delivery must be tested" : "deferred as requested"}`
)
console.log(
  "Manual launch gates: Supabase SMTP and redirects, confirmed admin login, policy approval, product sizes, backups/restore, monitoring and live checkout verification."
)
if (failed) process.exitCode = 1
