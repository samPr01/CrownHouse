import AuthForm from "@/components/auth-form"
import { getCurrentUser } from "@/lib/supabase/server"
import { safeAuthNext } from "@/lib/auth-validation"
import { redirect } from "next/navigation"
export default async function Page({searchParams}:{searchParams:Promise<{next?:string;error?:string;updated?:string}>}) {
  const query=await searchParams
  if(await getCurrentUser()) redirect(safeAuthNext(query.next))
  return <AuthForm mode="login" next={safeAuthNext(query.next)} notice={query.error?"This confirmation link is invalid or expired. Please request a new one.":query.updated?"Password updated. Please sign in.":undefined}/>
}
