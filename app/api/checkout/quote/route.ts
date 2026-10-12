import { quoteCart } from "@/lib/server/orders"
import { readCheckoutRequest, checkoutResponse } from "@/lib/server/http"
export async function POST(request: Request) {
  try {return Response.json(await quoteCart(await readCheckoutRequest(request)),{headers:{"Cache-Control":"no-store"}})}
  catch(error) {return checkoutResponse(error)}
}
