import postgres from "postgres"
import { drizzle } from "drizzle-orm/postgres-js"
import * as schema from "./schema"

export function connectDatabase(url: string) {
  if (!url || url.includes("[YOUR-PASSWORD]")) throw new Error("Database connection is not configured")
  const client = postgres(url, { prepare: false, max: 2, idle_timeout: 20, connect_timeout: 10, ssl: "require" })
  return { client, db: drizzle(client, { schema }) }
}
