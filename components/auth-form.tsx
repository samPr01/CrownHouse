"use client"
import { useActionState } from "react"
import Link from "next/link"
import Logo from "@/assets/logo/logo"
import { login,register,forgotPassword,resetPassword,type AuthState } from "@/app/auth/actions"
export default function AuthForm({mode,next="/account",notice}:{mode:"login"|"register"|"forgot"|"reset";next?:string;notice?:string}) {
  const action={login,register,forgot:forgotPassword,reset:resetPassword}[mode]
  const [state,submit,pending]=useActionState<AuthState,FormData>(action,{})
  const heading={login:"Welcome back",register:"Create your account",forgot:"Reset your password",reset:"Choose a new password"}[mode]
  return <main className="flex min-h-[75vh] items-center justify-center px-5 py-16 bg-muted/20">
    <section className="w-full max-w-md space-y-7 border border-border bg-background p-6 sm:p-10">
      <Link href="/" className="mx-auto block w-fit" aria-label="CrownHouse homepage"><Logo /></Link>
      <h1 className="text-center text-3xl">{heading}</h1>
      {notice && <p role="status" className="text-sm">{notice}</p>}
      <form action={submit} className="space-y-5">
        <input type="hidden" name="next" value={next}/>
        {mode==="register" && <label className="block">Full name<input name="name" autoComplete="name" required minLength={2} maxLength={120} className="mt-2 w-full border p-3"/></label>}
        {mode!=="reset" && <label className="block">Email<input name="email" type="email" autoComplete="email" required maxLength={254} className="mt-2 w-full border p-3"/></label>}
        {mode!=="forgot" && <label className="block">Password<input name="password" type="password" autoComplete={mode==="login"?"current-password":"new-password"} required minLength={mode==="login"?1:10} maxLength={128} className="mt-2 w-full border p-3"/></label>}
        {mode==="reset" && <label className="block">Confirm password<input name="confirmPassword" type="password" autoComplete="new-password" required minLength={10} maxLength={128} className="mt-2 w-full border p-3"/></label>}
        {state.error && <p role="alert" className="text-red-700">{state.error}</p>}
        {state.message && <p role="status">{state.message}</p>}
        <button disabled={pending} className="w-full bg-foreground px-4 py-3 text-background disabled:opacity-40">{pending?"Please wait…":{login:"Sign in",register:"Create account",forgot:"Send reset link",reset:"Update password"}[mode]}</button>
      </form>
      <div className="flex flex-wrap justify-center gap-5 text-sm underline underline-offset-4">
        {mode==="login"?<><Link href="/register">Create account</Link><Link href="/forgot-password">Forgot password?</Link></>:<Link href="/login">Back to sign in</Link>}
        <Link href="/shop">Continue shopping</Link>
      </div>
    </section>
  </main>
}
