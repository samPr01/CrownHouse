import "../db/env"
import { processOrderEmails } from "../../lib/server/notifications"
try {
  const result=await processOrderEmails()
  console.log(result)
  if(!result.configured || result.failed) process.exitCode=1
} catch {console.error("Email worker failed; check database configuration and notification job statuses.");process.exitCode=1}
