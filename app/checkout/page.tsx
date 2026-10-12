import CheckoutClient from "@/components/checkout-client"
import { checkoutMode } from "@/lib/server/order-input"
import { getCurrentUser } from "@/lib/supabase/server"
import { accountDetails } from "@/lib/server/account"
export const dynamic = "force-dynamic"
export default async function CheckoutPage() {
  const account=await getCurrentUser()?await accountDetails():null
  return <CheckoutClient mode={checkoutMode()} account={account}/>
}
