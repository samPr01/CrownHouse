import "./env"
import { mkdir, writeFile } from "node:fs/promises"
import { encryptBackup, decryptBackup } from "../../lib/backup"
import { connectDatabase } from "../../lib/db/connection"
const secret = process.env.BACKUP_ENCRYPTION_KEY || ""
if (!secret)
  throw new Error("Configure BACKUP_ENCRYPTION_KEY before running a backup.")
const { client } = connectDatabase(process.env.MIGRATION_DATABASE_URL || "")
try {
  const tables = await client.begin(
    "isolation level repeatable read read only",
    async (tx) => {
      const names =
        await tx`select tablename from pg_tables where schemaname='commerce' order by tablename`
      const result: Record<string, unknown[]> = {}
      for (const { tablename } of names)
        result[tablename] = Array.from(
          await tx`select * from ${tx("commerce")}.${tx(tablename)}`
        )
      return result
    }
  )
  const payload = JSON.stringify({
    version: 1,
    createdAt: new Date().toISOString(),
    scope: "commerce-only; auth and storage require separate provider backups",
    tables,
  })
  const encrypted = encryptBackup(payload, secret)
  if (decryptBackup(encrypted, secret) !== payload)
    throw new Error("Backup integrity verification failed")
  await mkdir("backups", { recursive: true })
  const path = `backups/commerce-${new Date().toISOString().replace(/[:.]/g, "-")}.encrypted.json`
  await writeFile(path, encrypted, { mode: 0o600 })
  console.log(
    `Encrypted, integrity-checked commerce backup saved: ${path}. Keep the encryption key separately; this is not an Auth or Storage backup.`
  )
} catch {
  console.error("Backup failed. No database changes were made.")
  process.exitCode = 1
} finally {
  await client.end()
}
