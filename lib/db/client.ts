import "server-only"
import { sql } from "drizzle-orm"
import { connectDatabase } from "./connection"

let connection: ReturnType<typeof connectDatabase> | undefined
function database() {
  connection ??= connectDatabase(process.env.DATABASE_URL || "")
  return connection.db
}
type Transaction = Parameters<Parameters<ReturnType<typeof database>["transaction"]>[0]>[0]
export function withDatabase<T>(work: (tx: Transaction) => Promise<T>) {
  return database().transaction(async tx => {
    // Limit runtime queries even when the supplied connection is a migration user.
    await tx.execute(sql`set local role crownhouse_app`)
    return work(tx)
  })
}
