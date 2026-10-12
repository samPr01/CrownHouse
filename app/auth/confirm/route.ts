import { NextResponse, type NextRequest } from "next/server"
import { createAuthClient } from "@/lib/supabase/server"
export async function GET(request:NextRequest) {
  const token_hash=request.nextUrl.searchParams.get("token_hash")
  const type=request.nextUrl.searchParams.get("type")
  if(token_hash && (type==="email"||type==="recovery")) {
    const client=await createAuthClient();const {error}=await client.auth.verifyOtp({token_hash,type})
    if(!error) return NextResponse.redirect(new URL(type==="recovery"?"/reset-password":"/account",process.env.APP_URL!),{headers:{"Cache-Control":"no-store"}})
  }
  return NextResponse.redirect(new URL("/login?error=confirmation",process.env.APP_URL!),{headers:{"Cache-Control":"no-store"}})
}
