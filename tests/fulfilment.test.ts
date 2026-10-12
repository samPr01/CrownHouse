import { test } from "node:test"
import assert from "node:assert/strict"
import { canTransition, adminAllowed } from "../lib/fulfilment"
test("orders cannot skip dispatch, reopen or cancel after shipment", () => {
  assert.ok(canTransition("placed", "processing"))
  assert.ok(canTransition("processing", "shipped"))
  assert.ok(canTransition("shipped", "delivered"))
  for (const [from, to] of [
    ["placed", "delivered"],
    ["shipped", "cancelled"],
    ["delivered", "processing"],
    ["cancelled", "placed"],
  ])
    assert.equal(canTransition(from, to), false)
})
test("administrator access requires a confirmed exact allowlisted email", () => {
  assert.equal(
    adminAllowed("store@example.com", true, "STORE@example.com"),
    true
  )
  assert.equal(
    adminAllowed("store@example.com", false, "store@example.com"),
    false
  )
  assert.equal(
    adminAllowed(
      "store@example.com.attacker.invalid",
      true,
      "store@example.com"
    ),
    false
  )
  assert.equal(
    adminAllowed("other@example.com", true, "store@example.com"),
    false
  )
  assert.equal(adminAllowed("store@example.com", true, undefined), false)
})
