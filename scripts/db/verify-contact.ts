import "./env"
import assert from "node:assert/strict"
import { connectDatabase } from "../../lib/db/connection"
const { client } = connectDatabase(process.env.MIGRATION_DATABASE_URL || "")
try {
  const rows =
    await client`select id from commerce.contact_messages where email='browser-contact-test@example.invalid' and name='Synthetic contact verification' and message='Synthetic contact form verification. This test record will be removed after validation.'`
  assert.equal(rows.length, 1)
  await client`delete from commerce.contact_messages where id=${rows[0].id}`
  const [admin] =
    await client`select count(*)::int count from auth.users where lower(email) = any(${(
      process.env.ADMIN_EMAILS || ""
    )
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean)}) and email_confirmed_at is not null`
  console.log(
    "Browser contact form persistence verified; only its synthetic test message was removed."
  )
  console.log(
    `Confirmed administrator account: ${admin.count ? "exists; interactive login still requires the account password" : "not yet present; complete registration and email confirmation before using admin"}`
  )
} catch {
  console.error("Contact verification failed.")
  process.exitCode = 1
} finally {
  await client.end()
}
