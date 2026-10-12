import "server-only"
import { createHmac } from "node:crypto"
import { sql } from "drizzle-orm"
import { withDatabase } from "../db/client"
export async function rateLimit(
  scope: string,
  identity: string,
  limit: number,
  seconds = 900
) {
  const secret = process.env.RATE_LIMIT_SECRET || process.env.CRON_SECRET
  if (!secret) throw new Error("Rate limit secret is required.")
  const bucket = Math.floor(Date.now() / (seconds * 1000))
  const key = createHmac("sha256", secret)
    .update(`${scope}:${identity}:${bucket}`)
    .digest("hex")
  const expires = new Date((bucket + 1) * seconds * 1000)
  return withDatabase(async (tx) => {
    await tx.execute(
      sql`delete from commerce.request_limits where key in (select key from commerce.request_limits where expires_at < now() limit 100)`
    )
    const result = await tx.execute(
      sql`insert into commerce.request_limits (key,count,expires_at) values (${key},1,${expires.toISOString()}::timestamptz) on conflict (key) do update set count=commerce.request_limits.count+1 returning count`
    )
    return Number(result[0]?.count) <= limit
  })
}
