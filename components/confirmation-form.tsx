import ActionForm from "./action-form"
import { resendConfirmation } from "@/app/auth/actions"
export default function ConfirmationForm() {
  return (
    <details className="space-y-4 border p-4">
      <summary>Need a new confirmation email?</summary>
      <ActionForm action={resendConfirmation} label="Resend confirmation">
        <label className="block">
          Email{" "}
          <input
            name="email"
            type="email"
            maxLength={254}
            required
            className="mt-2 w-full"
          />
        </label>
      </ActionForm>
    </details>
  )
}
