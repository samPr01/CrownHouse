import "./env"
import { readFile } from "node:fs/promises"
import { randomUUID } from "node:crypto"
import assert from "node:assert/strict"
import { decryptBackup } from "../../lib/backup"
import { connectDatabase } from "../../lib/db/connection"
const file = process.argv[2]
if (!file) throw new Error("Provide the encrypted backup file to verify")
const backup = JSON.parse(
  decryptBackup(
    await readFile(file, "utf8"),
    process.env.BACKUP_ENCRYPTION_KEY || ""
  )
)
const names = Object.keys(backup.tables)
if (names.length !== 19 || names.some((t) => !/^[a-z_]+$/.test(t)))
  throw new Error("Unexpected backup schema")
const scratch = `backup_verify_${randomUUID().replaceAll("-", "")}`
const rollback = new Error("intentional restore test rollback")
const { client } = connectDatabase(process.env.MIGRATION_DATABASE_URL || "")
try {
  try {
    await client.begin(async (tx) => {
      await tx`create schema ${tx(scratch)}`
      for (const table of names)
        await tx`create table ${tx(scratch)}.${tx(table)} (like ${tx("commerce")}.${tx(table)} including all)`
      // Restore into an isolated schema, then validate the source schema's foreign keys too.
      for (const table of names) {
        const rows = backup.tables[table]
        if (rows.length)
          await tx`insert into ${tx(scratch)}.${tx(table)} select * from json_populate_recordset(null::${tx(scratch)}.${tx(table)},${JSON.stringify(rows)}::json)`
        const [count] =
          await tx`select count(*)::int count from ${tx(scratch)}.${tx(table)}`
        assert.equal(count.count, rows.length)
      }
      const constraints =
        await tx`select c.conname,t.relname,pg_get_constraintdef(c.oid) definition from pg_constraint c join pg_class t on t.oid=c.conrelid join pg_namespace n on n.oid=t.relnamespace where n.nspname='commerce' and c.contype='f'`
      for (const c of constraints) {
        if (!names.includes(c.relname) || !/^[a-zA-Z_0-9]+$/.test(c.conname))
          throw new Error("Unexpected constraint name")
        const definition = String(c.definition).replace(
          /REFERENCES commerce\./g,
          `REFERENCES "${scratch}".`
        )
        if (!definition.includes(`REFERENCES "${scratch}".`))
          throw new Error("Cannot safely map foreign key")
        await tx.unsafe(
          `alter table "${scratch}"."${c.relname}" add constraint "${c.conname}" ${definition}`
        )
      }
      throw rollback
    })
  } catch (error) {
    if (error !== rollback) throw error
  }
  console.log(
    "Encrypted backup restored into an isolated schema: all 19 table counts and foreign keys validated. Test schema and restored data rolled back; source untouched."
  )
} catch {
  console.error(
    "Backup restore verification failed; isolated schema rolled back."
  )
  process.exitCode = 1
} finally {
  await client.end()
}
