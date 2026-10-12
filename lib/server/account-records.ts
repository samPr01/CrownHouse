import "server-only"
import { and,eq } from "drizzle-orm"
import { addresses,customers,orders,orderItems,orderAddresses,shipments,returnRequests } from "../db/schema"
import { addressInput } from "../auth-validation"
import type { withDatabase } from "../db/client"
type Tx=Parameters<Parameters<typeof withDatabase>[0]>[0]
// Callers supply an Auth-server-verified identity; never a user ID from request data.
export async function readCustomerOrder(tx:Tx,authUserId:string,orderId:string) {
  const [row]=await tx.select({order:orders,address:orderAddresses.address}).from(orders)
    .innerJoin(customers,eq(orders.customerId,customers.id)).innerJoin(orderAddresses,eq(orderAddresses.orderId,orders.id))
    .where(and(eq(orders.id,orderId),eq(customers.authUserId,authUserId)))
  if(!row) return null
  const items=await tx.select().from(orderItems).where(eq(orderItems.orderId,orderId))
  const [shipment]=await tx.select().from(shipments).where(eq(shipments.orderId,orderId))
  const [returnRequest]=await tx.select().from(returnRequests).where(eq(returnRequests.orderId,orderId))
  return {...row,items,address:addressInput.parse(row.address),shipment,returnRequest}
}
export async function changeCustomerAddress(tx:Tx,customerId:string,addressId:string,address:ReturnType<typeof addressInput.parse>) {
  return tx.update(addresses).set({address}).where(and(eq(addresses.id,addressId),eq(addresses.customerId,customerId))).returning({id:addresses.id})
}
export async function deleteCustomerAddress(tx:Tx,customerId:string,addressId:string) {
  return tx.delete(addresses).where(and(eq(addresses.id,addressId),eq(addresses.customerId,customerId))).returning({id:addresses.id})
}
