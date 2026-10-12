import "./env"
import { connectDatabase } from "../../lib/db/connection"
const {client} = connectDatabase(process.env.MIGRATION_DATABASE_URL || "")
try {
  const [result] = await client`select current_database() as name`
  console.log("Database connection verified:",result.name)
  const tables = await client`select table_name from information_schema.tables where table_schema='commerce' order by table_name`
  console.log("Commerce tables:",tables.map(t=>t.table_name).join(", ") || "None yet")
} catch(error) {
  console.error("Database check failed:",(error as {code?:string}).code || "connection error")
  process.exitCode=1
} finally { await client.end() }
