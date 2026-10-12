import "server-only"
import { redirect, notFound } from "next/navigation"
import { getCurrentUser } from "../supabase/server"
import { adminAllowed } from "../fulfilment"
export async function requireAdmin() {
  const user = await getCurrentUser()
  if (!user) redirect("/login?next=/admin")
  if (
    !adminAllowed(
      user.email,
      Boolean(user.email_confirmed_at),
      process.env.ADMIN_EMAILS
    )
  )
    notFound()
  return user.id
}
