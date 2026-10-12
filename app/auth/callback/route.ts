import { NextResponse, type NextRequest } from "next/server"
import { createAuthClient } from "@/lib/supabase/server"
import { safeAuthNext } from "@/lib/auth-validation"
export async function GET(request:NextRequest) {
  const code=request.nextUrl.searchParams.get("code")
  if(code) {
    const client=await createAuthClient();const {error}=await client.auth.exchangeCodeForSession(code)
    if(!error) return NextResponse.redirect(new URL(safeAuthNext(request.nextUrl.searchParams.get("next")),process.env.APP_URL!),{headers:{"Cache-Control":"no-store"}})
  }
  return NextResponse.redirect(new URL("/login?error=confirmation",process.env.APP_URL!),{headers:{"Cache-Control":"no-store"}})
}
