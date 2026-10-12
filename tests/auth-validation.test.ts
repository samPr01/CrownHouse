import {test} from "node:test"
import assert from "node:assert/strict"
import {safeAuthNext,passwordInput,profileInput,addressInput} from "../lib/auth-validation"
test("auth redirects reject external URLs and arbitrary paths",()=>{
  for(const value of ["https://attacker.invalid","//attacker.invalid","/\\attacker.invalid","/account?next=https://attacker.invalid",null]) assert.equal(safeAuthNext(value),"/account")
  assert.equal(safeAuthNext("/checkout"),"/checkout");assert.equal(safeAuthNext("/reset-password"),"/reset-password")
})
test("account forms validate password, phone and Indian delivery address",()=>{
  assert.equal(passwordInput.safeParse("short").success,false)
  assert.equal(profileInput.safeParse({name:"Test Person",phone:"not-a-phone"}).success,false)
  assert.equal(addressInput.safeParse({line1:"Test street",line2:"",city:"Indore",state:"MP",postalCode:"452001",country:"IN"}).success,true)
  assert.equal(addressInput.safeParse({line1:"Test street",city:"Indore",state:"MP",postalCode:"000000",country:"IN"}).success,false)
})
