import "server-only"
import { and, asc, eq, inArray, lte } from "drizzle-orm"
import { withDatabase } from "../db/client"
import { customers, orders, orderItems, orderAddresses, notificationJobs } from "../db/schema"
import { orderEmail } from "../order-email"
import { emailConfig, EmailSendError, sendOrderEmail } from "./email-provider"

export async function processOrderEmails(orderId?:string,limit=10) {
  const config=emailConfig()
  if(!config) return {accepted:0,failed:0,configured:false}
  let accepted=0,failed=0
  for(let count=0;count<Math.min(limit,10);count++) {
    const job=await withDatabase(async tx=>{
      const conditions=[inArray(notificationJobs.status,["pending","retry","sending","blocked"]),lte(notificationJobs.nextAttemptAt,new Date())]
      if(orderId) conditions.push(eq(notificationJobs.orderId,orderId))
      const [row]=await tx.select().from(notificationJobs).where(and(...conditions)).orderBy(asc(notificationJobs.createdAt)).limit(1).for("update",{skipLocked:true})
      if(!row) return null
      // Resend deduplicates for 24h. Stop ambiguous automatic retries before that window expires.
      if(row.attempts>=6 || (!row.firstAttemptAt && Date.now()-row.createdAt.getTime()>7*24*60*60*1000) || (row.firstAttemptAt && Date.now()-row.firstAttemptAt.getTime()>23*60*60*1000)) {
        await tx.update(notificationJobs).set({status:"failed",lastError:"manual_review_required"}).where(eq(notificationJobs.id,row.id))
        return {expired:true as const}
      }
      const attempts=row.attempts+1
      await tx.update(notificationJobs).set({status:"sending",attempts,firstAttemptAt:row.firstAttemptAt||new Date(),
        nextAttemptAt:new Date(Date.now()+5*60*1000),lastError:null}).where(eq(notificationJobs.id,row.id))
      return {...row,attempts,expired:false as const}
    })
    if(!job) break
    if(job.expired) {failed++;continue}
    try {
      const data=await withDatabase(async tx=>{
        const [row]=await tx.select({order:orders,customer:customers,address:orderAddresses.address}).from(orders)
          .innerJoin(customers,eq(orders.customerId,customers.id)).innerJoin(orderAddresses,eq(orderAddresses.orderId,orders.id)).where(eq(orders.id,job.orderId))
        if(!row || row.order.paymentMethod!=="cod" || !["merchant_order","customer_confirmation"].includes(job.kind)) throw new EmailSendError(false,"invalid_notification_job")
        const items=await tx.select().from(orderItems).where(eq(orderItems.orderId,job.orderId)).orderBy(asc(orderItems.id))
        return {id:row.order.id,name:row.order.customerDetails?.name||row.customer.name,email:row.order.customerDetails?.email||row.customer.email,phone:row.order.customerDetails?.phone||row.customer.phone,
          subtotalMinor:row.order.subtotalMinor,shippingMinor:row.order.shippingMinor,totalMinor:row.order.totalMinor,address:row.address as Record<string,unknown>,items}
      })
      const message=orderEmail(data,job.kind as "merchant_order"|"customer_confirmation")
      const providerReference=await sendOrderEmail({...message,to:job.kind==="merchant_order"?config.to:data.email},`order-email/${job.id}`)
      await withDatabase(tx=>tx.update(notificationJobs).set({status:"accepted",providerReference,sentAt:new Date(),lastError:null})
        .where(and(eq(notificationJobs.id,job.id),eq(notificationJobs.attempts,job.attempts))))
      accepted++
    } catch(error) {
      const retryable=!(error instanceof EmailSendError)||error.retryable
      await withDatabase(tx=>tx.update(notificationJobs).set({status:retryable&&job.attempts<6?"retry":"failed",
        lastError:error instanceof EmailSendError?error.code:"notification_processing_failed",
        nextAttemptAt:new Date(Date.now()+Math.min(60,2**job.attempts)*60*1000)})
        .where(and(eq(notificationJobs.id,job.id),eq(notificationJobs.attempts,job.attempts))))
      failed++
    }
  }
  return {accepted,failed,configured:true}
}
