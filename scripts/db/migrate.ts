import "./env"
import { connectDatabase } from "../../lib/db/connection"
import { migrate } from "drizzle-orm/postgres-js/migrator"
const {client,db}=connectDatabase(process.env.MIGRATION_DATABASE_URL || "")
try {
  await migrate(db,{migrationsFolder:"db/migrations"})
  console.log("Versioned migrations applied.")
} catch(error) {
  console.error("Migration failed:",(error as {code?:string}).code || "migration error")
  process.exitCode=1
} finally {await client.end()}
