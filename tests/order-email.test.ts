import { test } from "node:test"
import assert from "node:assert/strict"
import { orderEmail, type OrderEmailData } from "../lib/order-email"
import { emailConfig, sendOrderEmail, EmailSendError } from "../lib/server/email-provider"
const order:OrderEmailData={id:"order-reference",name:"<script>Customer</script>",email:"customer@example.invalid",phone:"9999999999",
  subtotalMinor:50000,shippingMinor:9900,totalMinor:59900,address:{line1:"<img src=x>",city:"Indore",state:"MP",postalCode:"452001",country:"IN"},
  items:[{name:"Shirt <b>test</b>",sku:"CH-test",options:{Size:"M"},quantity:1,unitPriceMinor:50000}]}
test("email escapes customer input and describes unpaid COD accurately",()=>{
  const result=orderEmail(order,"customer_confirmation")
  assert.ok(!result.html.includes("<script>"));assert.ok(!result.html.includes("<img src=x>"))
  assert.ok(result.html.includes("&lt;script&gt;"));assert.match(result.text,/599\.00/)
  assert.match(result.text,/Payment has not been collected/);assert.match(result.text,/Size: M/)
})
test("store notification contains fulfillment details",()=>{
  const result=orderEmail(order,"merchant_order")
  for(const value of [order.email,order.phone,order.id,"452001","Qty: 1","CH-test"]) assert.ok(result.text.includes(value))
})
test("provider uses stable idempotency key and distinguishes retryable failures",async()=>{
  const saved={key:process.env.RESEND_API_KEY,from:process.env.ORDER_EMAIL_FROM,to:process.env.ORDER_EMAIL_TO}
  process.env.RESEND_API_KEY="re_test_credential_not_real";process.env.ORDER_EMAIL_FROM="CrownHouse <orders@example.invalid>";process.env.ORDER_EMAIL_TO="store@example.invalid"
  try {
    const payload={to:order.email,...orderEmail(order,"customer_confirmation")}
    let calls=0
    const fake:typeof fetch=async(url,init)=>{
      calls++;assert.equal(url,"https://api.resend.com/emails")
      assert.equal(new Headers(init?.headers).get("Idempotency-Key"),"order-email/job-id")
      const body=JSON.parse(String(init?.body));assert.deepEqual(body.to,[order.email]);assert.equal(body.reply_to,"store@example.invalid")
      return Response.json({id:"provider-id"})
    }
    assert.equal(await sendOrderEmail(payload,"order-email/job-id",fake),"provider-id");assert.equal(calls,1)
    for(const [status,retryable] of [[429,true],[503,true],[403,false]] as const)
      await assert.rejects(()=>sendOrderEmail(payload,"order-email/job-id",async()=>new Response("",{status})),e=>e instanceof EmailSendError&&e.retryable===retryable)
    delete process.env.RESEND_API_KEY
    assert.equal(emailConfig(),null)
    await assert.rejects(()=>sendOrderEmail(payload,"order-email/job-id",fake),/email_not_configured/)
    assert.equal(calls,1)
  } finally {
    for(const [key,value] of Object.entries({RESEND_API_KEY:saved.key,ORDER_EMAIL_FROM:saved.from,ORDER_EMAIL_TO:saved.to}))
      if(value===undefined) delete process.env[key];else process.env[key]=value
  }
})
