import { timingSafeEqual } from "node:crypto"
import { processOrderEmails } from "@/lib/server/notifications"
export const maxDuration=300
export async function GET(request:Request) {
  const secret=process.env.CRON_SECRET
  const received=request.headers.get("authorization")||""
  const expected=`Bearer ${secret}`
  if(!secret || secret.length<32 || Buffer.byteLength(received)!==Buffer.byteLength(expected) || !timingSafeEqual(Buffer.from(received),Buffer.from(expected)))
    return Response.json({error:"Unauthorized"},{status:401})
  try {return Response.json(await processOrderEmails(undefined,10),{headers:{"Cache-Control":"no-store"}})}
  catch {return Response.json({error:"Email worker unavailable"},{status:503})}
}
