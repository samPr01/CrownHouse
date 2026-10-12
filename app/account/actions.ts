"use server"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { updateProfile,saveAddress,removeAddress } from "@/lib/server/account"
export type AccountState={error?:string;message?:string}
export async function profileAction(_state:AccountState,form:FormData):Promise<AccountState> {
  try {await updateProfile({name:form.get("name"),phone:form.get("phone")})}
  catch {return {error:"Unable to save. Enter your full name and a valid phone number."}}
  revalidatePath("/account");return {message:"Profile saved."}
}
export async function addressAction(_state:AccountState,form:FormData):Promise<AccountState> {
  const id=String(form.get("id")||"")
  if(id && !z.uuid().safeParse(id).success) return {error:"Invalid address."}
  try {await saveAddress({line1:form.get("line1"),line2:form.get("line2"),city:form.get("city"),state:form.get("state"),postalCode:form.get("postalCode"),country:"IN"},id||undefined)}
  catch {return {error:"Unable to save this address. Check all fields; up to ten addresses are allowed."}}
  revalidatePath("/account");return {message:"Address saved."}
}
export async function deleteAddressAction(form:FormData) {
  const id=z.uuid().safeParse(form.get("id"))
  if(id.success) await removeAddress(id.data)
  revalidatePath("/account")
}
