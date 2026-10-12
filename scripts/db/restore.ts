import "./env"
import { readFile } from "node:fs/promises"
import { decryptBackup } from "../../lib/backup"
import { connectDatabase } from "../../lib/db/connection"
const file = process.argv[2]
const target = process.env.RESTORE_DATABASE_URL
if (!file || !target || !process.argv.includes("--confirm-empty-target"))
  throw new Error(
    "Provide a backup file, RESTORE_DATABASE_URL and --confirm-empty-target. Migrate the empty staging target first."
  )
const source = new URL(
  process.env.MIGRATION_DATABASE_URL || process.env.DATABASE_URL || ""
)
const destination = new URL(target)
const project = (u: URL) =>
  u.hostname.match(/^db\.([a-z0-9]+)\.supabase\.co$/)?.[1] ||
  (decodeURIComponent(u.username).includes(".")
    ? decodeURIComponent(u.username).split(".").at(-1)
    : u.hostname)
if (project(source) === project(destination))
  throw new Error(
    "Restore to the source database is forbidden. Use a separate staging project."
  )
const backup = JSON.parse(
  decryptBackup(
    await readFile(file, "utf8"),
    process.env.BACKUP_ENCRYPTION_KEY || ""
  )
)
const sequence = [
  "categories",
  "products",
  "product_variants",
  "product_images",
  "inventory",
  "customers",
  "addresses",
  "orders",
  "order_items",
  "order_addresses",
  "inventory_adjustments",
  "payment_attempts",
  "payment_events",
  "notification_jobs",
  "admin_audit_logs",
  "shipments",
  "return_requests",
  "contact_messages",
  "request_limits",
]
if (
  backup.version !== 1 ||
  !backup.tables ||
  Object.keys(backup.tables).sort().join() !== [...sequence].sort().join()
)
  throw new Error("Backup schema does not match the application schema")
const { client } = connectDatabase(target)
try {
  await client.begin(async (tx) => {
    for (const table of sequence) {
      const [row] =
        await tx`select count(*)::int count from ${tx("commerce")}.${tx(table)}`
      if (row.count) throw new Error("Target must be empty")
    }
    for (const table of sequence) {
      const rows = backup.tables[table]
      if (!Array.isArray(rows)) throw new Error("Invalid backup rows")
      if (rows.length)
        await tx`insert into ${tx("commerce")}.${tx(table)} select * from json_populate_recordset(null::${tx("commerce")}.${tx(table)},${JSON.stringify(rows)}::json)`
      const [count] =
        await tx`select count(*)::int count from ${tx("commerce")}.${tx(table)}`
      if (count.count !== rows.length) throw new Error("Restore count mismatch")
    }
  })
  console.log(
    "Commerce restore committed and row counts verified in the separate empty target. Auth users and Storage were not restored."
  )
} catch {
  console.error(
    "Restore failed and rolled back. Check target schema, permissions and backup version."
  )
  process.exitCode = 1
} finally {
  await client.end()
}
