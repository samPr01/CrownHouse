"use client"
import { useActionState, type ReactNode } from "react"
export type FormResult = { error?: string; message?: string }
export default function ActionForm({
  action,
  children,
  label = "Save",
}: {
  action: (state: FormResult, form: FormData) => Promise<FormResult>
  children: ReactNode
  label?: string
}) {
  const [state, submit, pending] = useActionState(action, {})
  return (
    <form
      action={submit}
      className="space-y-4 [&_input]:max-w-full [&_input]:border [&_input]:p-2 [&_select]:border [&_select]:p-2 [&_textarea]:w-full [&_textarea]:border [&_textarea]:p-2"
    >
      {children}
      {state.error && (
        <p role="alert" className="text-red-700">
          {state.error}
        </p>
      )}
      {state.message && <p role="status">{state.message}</p>}
      <button
        disabled={pending}
        className="border bg-foreground px-4 py-2 text-background disabled:opacity-40"
      >
        {pending ? "Saving…" : label}
      </button>
    </form>
  )
}
