import "server-only"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { cache } from "react"
export async function createAuthClient() {
  const store=await cookies()
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,{
    cookieOptions:{httpOnly:true,sameSite:"lax",secure:process.env.APP_URL?.startsWith("https://")||false},
    cookies:{getAll:()=>store.getAll(),setAll(values){
      try {values.forEach(({name,value,options})=>store.set(name,value,options))}
      catch { /* Server Components rely on proxy.ts to persist refreshed cookies. */ }
    }},
  })
}
export const getCurrentUser=cache(async()=>{
  const client=await createAuthClient()
  const {data:{user},error}=await client.auth.getUser()
  return !error && user?.email && user.email_confirmed_at ? user : null
})
