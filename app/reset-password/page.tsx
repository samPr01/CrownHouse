import AuthForm from "@/components/auth-form"
import { getCurrentUser } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
export default async function Page() {
  if(!await getCurrentUser()) redirect("/forgot-password")
  return <AuthForm mode="reset"/>
}
