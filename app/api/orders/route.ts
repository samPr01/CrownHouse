import { createOrder } from "@/lib/server/orders"
import { readCheckoutRequest, checkoutResponse } from "@/lib/server/http"
import { after } from "next/server"
import { processOrderEmails } from "@/lib/server/notifications"
import { emailConfig } from "@/lib/server/email-provider"
export const maxDuration = 60
export async function POST(request: Request) {
  try {
    const order=await createOrder(await readCheckoutRequest(request))
    if(order.mode==="cod") after(async()=>{
      try {await processOrderEmails(order.id,2)}
      catch {console.error("Order email processing deferred; saved notification jobs need retry")}
    })
    return Response.json({...order,emailQueued:order.mode==="cod"&&Boolean(emailConfig())},{status:201,headers:{"Cache-Control":"no-store"}})
  }
  catch(error) {return checkoutResponse(error)}
}
