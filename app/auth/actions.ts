"use server"
import { redirect } from "next/navigation"
import { createAuthClient } from "@/lib/supabase/server"
import { emailInput, passwordInput, safeAuthNext } from "@/lib/auth-validation"
import { rateLimit } from "@/lib/server/rate-limit"
import { headers } from "next/headers"
async function allowed(scope:string,email:string) {
  try {
    const h=await headers();const address=process.env.VERCEL?h.get("x-vercel-forwarded-for")||"shared":"shared"
    return await rateLimit(`auth-${scope}-network`,address,scope==="login"?60:15,900) && await rateLimit(`auth-${scope}`,email,scope==="login"?15:3,900)
  } catch {return false}
}
export type AuthState={error?:string;message?:string}
export async function login(_state:AuthState,form:FormData):Promise<AuthState> {
  const email=emailInput.safeParse(form.get("email"));const password=form.get("password")
  if(!email.success || typeof password!=="string" || !password || password.length>128) return {error:"Enter a valid email and password."}
  if(!await allowed("login",email.data)) return {error:"Sign-in temporarily unavailable or too many attempts. Please try again later."}
  const client=await createAuthClient()
  const {error}=await client.auth.signInWithPassword({email:email.data,password})
  if(error) return {error:"Unable to sign in. Check your details and confirm your email first."}
  redirect(safeAuthNext(form.get("next")))
}
export async function register(_state:AuthState,form:FormData):Promise<AuthState> {
  const email=emailInput.safeParse(form.get("email"));const password=passwordInput.safeParse(form.get("password"))
  const name=String(form.get("name")||"").trim()
  if(!email.success||!password.success||name.length<2||name.length>120) return {error:"Enter your name, email and a password of at least ten characters."}
  if(!await allowed("register",email.data)) return {error:"Registration temporarily unavailable or too many attempts. Please try again later."}
  const client=await createAuthClient()
  const {data,error}=await client.auth.signUp({email:email.data,password:password.data,
    options:{data:{full_name:name},emailRedirectTo:`${process.env.APP_URL}/auth/callback?next=/account`}})
  if(error) return {error:"Unable to register right now. Email delivery may not be configured, or the request limit was reached. Please try again later."}
  if(data.session) redirect("/account")
  return {message:"If registration is available for this address, you’ll receive an email to confirm your account. Already registered? Sign in instead."}
}
export async function forgotPassword(_state:AuthState,form:FormData):Promise<AuthState> {
  const email=emailInput.safeParse(form.get("email"))
  if(!email.success) return {error:"Enter a valid email address."}
  if(!await allowed("recovery",email.data)) return {message:"If an account exists and email delivery is available, a password-reset link will arrive shortly."}
  const client=await createAuthClient()
  await client.auth.resetPasswordForEmail(email.data,{redirectTo:`${process.env.APP_URL}/auth/callback?next=/reset-password`})
  return {message:"If an account exists and email delivery is available, a password-reset link will arrive shortly."}
}
export async function resetPassword(_state:AuthState,form:FormData):Promise<AuthState> {
  const password=passwordInput.safeParse(form.get("password"))
  if(!password.success || password.data!==form.get("confirmPassword")) return {error:"Use matching passwords of at least ten characters."}
  const client=await createAuthClient();const {data:{user},error:authError}=await client.auth.getUser()
  if(authError||!user) return {error:"Your reset link has expired. Request a new one."}
  const {error}=await client.auth.updateUser({password:password.data})
  if(error) return {error:"Unable to update your password. Try another password or request a new reset link."}
  await client.auth.signOut()
  redirect("/login?updated=1")
}
export async function logout() {
  const client=await createAuthClient();await client.auth.signOut()
  redirect("/login")
}
export async function resendConfirmation(_state:AuthState,form:FormData):Promise<AuthState> {
  const email=emailInput.safeParse(form.get("email"))
  if(!email.success) return {error:"Enter a valid email address."}
  if(await allowed("confirmation",email.data)) {
    const client=await createAuthClient()
    await client.auth.resend({type:"signup",email:email.data,options:{emailRedirectTo:`${process.env.APP_URL}/auth/callback?next=/account`}})
  }
  return {message:"If confirmation is needed and email delivery is available, a new link will arrive shortly."}
}
