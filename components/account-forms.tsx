"use client"
import { useActionState } from "react"
import { profileAction,addressAction,deleteAddressAction,type AccountState } from "@/app/account/actions"
export type SavedAddress={id:string;line1:string;line2:string;city:string;state:string;postalCode:string;country:"IN"}
function Status({state}:{state:AccountState}) {return <>{state.error&&<p role="alert" className="text-red-700">{state.error}</p>}{state.message&&<p role="status">{state.message}</p>}</>}
export function ProfileForm({name,phone,email}:{name:string;phone:string;email:string}) {
  const [state,action,pending]=useActionState(profileAction,{})
  return <form action={action} className="space-y-4">
    <label className="block">Full name<input required name="name" minLength={2} maxLength={120} defaultValue={name} autoComplete="name" className="mt-2 w-full border p-3"/></label>
    <label className="block">Phone<input required name="phone" type="tel" maxLength={16} defaultValue={phone} autoComplete="tel" className="mt-2 w-full border p-3"/></label>
    <p>Email: {email}</p><p className="text-sm text-muted-foreground">Your email is managed through your verified login.</p>
    <Status state={state}/><button disabled={pending} className="border px-5 py-3 disabled:opacity-40">{pending?"Saving…":"Save profile"}</button>
  </form>
}
export function AddressForm({address}:{address?:SavedAddress}) {
  const [state,action,pending]=useActionState(addressAction,{})
  return <div className="space-y-4 border p-5">
    <form action={action} className="space-y-4">
      {address&&<input type="hidden" name="id" value={address.id}/>}
      {([{name:"line1",label:"Street address",autoComplete:"address-line1"},{name:"line2",label:"Apartment / landmark (optional)",autoComplete:"address-line2"},
        {name:"city",label:"City",autoComplete:"address-level2"},{name:"state",label:"State",autoComplete:"address-level1"},{name:"postalCode",label:"PIN code",autoComplete:"postal-code"}] as const)
        .map(field=><label key={field.name} className="block">{field.label}<input name={field.name} required={field.name!=="line2"} defaultValue={address?.[field.name]||""}
          autoComplete={field.autoComplete} maxLength={200} pattern={field.name==="postalCode"?"[1-9][0-9]{5}":undefined} className="mt-2 w-full border p-3"/></label>)}
      <p>India</p><Status state={state}/><button disabled={pending} className="border px-5 py-3 disabled:opacity-40">{pending?"Saving…":address?"Update address":"Save address"}</button>
    </form>
    {address&&<form action={deleteAddressAction}><input type="hidden" name="id" value={address.id}/><button className="text-sm underline underline-offset-4">Remove saved address</button></form>}
  </div>
}
