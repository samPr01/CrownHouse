import "server-only"
import { z } from "zod"
const configSchema=z.object({key:z.string().startsWith("re_").min(10),from:z.string().min(5).refine(s=>!/[\r\n]/.test(s)),to:z.email()})
export function emailConfig() {
  const result=configSchema.safeParse({key:process.env.RESEND_API_KEY,from:process.env.ORDER_EMAIL_FROM,to:process.env.ORDER_EMAIL_TO})
  return result.success?result.data:null
}
export class EmailSendError extends Error {
  constructor(public retryable:boolean,public code:string) {super(code)}
}
export async function sendOrderEmail(payload:{to:string;subject:string;text:string;html:string},key:string,transport:typeof fetch=fetch) {
  const config=emailConfig()
  if(!config) throw new EmailSendError(false,"email_not_configured")
  let response:Response
  try {response=await transport("https://api.resend.com/emails",{method:"POST",
    headers:{Authorization:`Bearer ${config.key}`,"Content-Type":"application/json","Idempotency-Key":key},
    body:JSON.stringify({from:config.from,to:[payload.to],reply_to:config.to,subject:payload.subject,text:payload.text,html:payload.html}),
    signal:AbortSignal.timeout(12000)})}
  catch {throw new EmailSendError(true,"provider_connection_failed")}
  if(!response.ok) throw new EmailSendError(response.status===429||response.status>=500,`provider_http_${response.status}`)
  const result=await response.json() as {id?:unknown}
  if(typeof result.id!=="string") throw new EmailSendError(true,"invalid_provider_response")
  return result.id
}
