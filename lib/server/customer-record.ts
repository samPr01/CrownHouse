import "server-only"
import { eq } from "drizzle-orm"
import { customers } from "../db/schema"
import type { withDatabase } from "../db/client"
type Tx=Parameters<Parameters<typeof withDatabase>[0]>[0]
export type CustomerIdentity={id:string;email:string;name?:string}
export async function ensureCustomer(tx:Tx,identity:CustomerIdentity) {
  await tx.insert(customers).values({authUserId:identity.id,email:identity.email,name:identity.name?.slice(0,120)||"",phone:""})
    .onConflictDoNothing({target:customers.authUserId})
  const [customer]=await tx.select().from(customers).where(eq(customers.authUserId,identity.id))
  if(!customer) throw new Error("Unable to load customer")
  if(customer.email!==identity.email) await tx.update(customers).set({email:identity.email}).where(eq(customers.id,customer.id))
  return {...customer,email:identity.email}
}
