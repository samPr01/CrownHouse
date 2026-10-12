import "./env"
import { randomBytes } from "node:crypto"
import { readFile, writeFile } from "node:fs/promises"
import { connectDatabase } from "../../lib/db/connection"
const role = "crownhouse_web"
const { client } = connectDatabase(process.env.MIGRATION_DATABASE_URL || "")
try {
  const [existing] =
    await client`select count(*)::int count from pg_roles where rolname=${role}`
  if (existing.count)
    throw new Error("Runtime role already exists; no password was changed.")
  const password = randomBytes(32).toString("base64url")
  await client.begin(async (tx) => {
    // Fixed identifier and a generated base64url password; neither can contain SQL syntax.
    await tx.unsafe(
      `create role ${role} login noinherit nosuperuser nocreatedb nocreaterole noreplication nobypassrls password '${password}'`
    )
    await tx.unsafe(`grant crownhouse_app to ${role}`)
  })
  const url = new URL(process.env.DATABASE_URL || "")
  const projectRef=new URL(process.env.NEXT_PUBLIC_SUPABASE_URL||"").hostname.split(".")[0]
  if(!/^[a-z0-9]+$/.test(projectRef))throw new Error("Invalid project reference")
  url.username = `${role}.${projectRef}`
  url.password = password
  const content = await readFile(".env.local", "utf8")
  // Save recovery details locally before attempting a new pooler connection.
  await writeFile(
    ".env.local",
    `${content}\nPENDING_RUNTIME_DATABASE_URL=${url.toString()}\n`
  )
  const runtime = connectDatabase(url.toString())
  try {
    await runtime.client.begin(async (tx) => {
      await tx`set local role crownhouse_app`
      await tx`select id from commerce.products limit 1`
    })
    const [privilege] =
      await runtime.client`select has_schema_privilege(current_user,'auth','usage') auth_access, has_schema_privilege(current_user,'commerce','create') schema_create`
    if (privilege.auth_access || privilege.schema_create)
      throw new Error("Runtime privilege check failed")
    const final = (await readFile(".env.local", "utf8"))
      .replace(/^DATABASE_URL=.*$/m, `DATABASE_URL=${url.toString()}`)
      .replace(/^PENDING_RUNTIME_DATABASE_URL=.*\r?\n?/m, "")
    await writeFile(".env.local", final)
    console.log(
      "Dedicated restricted runtime connection verified and saved locally. Migration credentials remain separate. No credentials displayed."
    )
  } finally {
    await runtime.client.end()
  }
} catch (error) {
  console.error(
    "Runtime role setup did not complete:",
    (error as { code?: string }).code ||
      "configuration/privilege check; review local pending connection if present"
  )
  process.exitCode = 1
} finally {
  await client.end()
}
