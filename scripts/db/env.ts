import { config } from "dotenv"
config({path: ".env.local",quiet:true})
if (process.env.MIGRATION_DATABASE_URL) {
  const url = new URL(process.env.MIGRATION_DATABASE_URL)
  if (!url.username.endsWith(".xypfqjsjpusshaeirzyd") && url.hostname !== "db.xypfqjsjpusshaeirzyd.supabase.co") {
    throw new Error("Unexpected migration database project. Review scripts/db/env.ts before changing targets.")
  }
}
