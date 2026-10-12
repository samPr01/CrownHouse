import { desc } from "drizzle-orm"
import { withDatabase } from "@/lib/db/client"
import { contactMessages } from "@/lib/db/schema"
import { requireAdmin } from "@/lib/server/admin"
import ActionForm from "@/components/action-form"
import { resolveMessage } from "../actions"
export default async function Page() {
  await requireAdmin()
  const list = await withDatabase((tx) =>
    tx
      .select()
      .from(contactMessages)
      .orderBy(desc(contactMessages.createdAt))
      .limit(100)
  )
  return (
    <section className="space-y-5">
      <h2 className="text-2xl">Latest 100 contact messages</h2>
      <p>Messages are saved here. Email forwarding is not activated.</p>
      {list.map((m) => (
        <article className="space-y-3 border p-5" key={m.id}>
          <p>
            {m.name} · {m.email}
          </p>
          <p className="break-words whitespace-pre-wrap">{m.message}</p>
          <p>
            {m.status} · {m.createdAt.toLocaleString("en-IN")}
          </p>
          {m.status === "new" && (
            <ActionForm action={resolveMessage} label="Mark resolved">
              <input type="hidden" name="id" value={m.id} />
            </ActionForm>
          )}
        </article>
      ))}
    </section>
  )
}
