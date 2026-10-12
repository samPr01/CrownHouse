import { test } from "node:test"
import assert from "node:assert/strict"
import {
  cartInput,
  orderInput,
  shippingMinor,
  checkoutMode,
  checkoutValidationMessage,
} from "../lib/server/order-input"

test("cart combines duplicate quantities and rejects aggregate excess", () => {
  assert.deepEqual(
    cartInput.parse([
      { variantId: "a", quantity: 2 },
      { variantId: "a", quantity: 3 },
    ]),
    [{ variantId: "a", quantity: 5 }]
  )
  assert.equal(
    cartInput.safeParse([
      { variantId: "a", quantity: 6 },
      { variantId: "a", quantity: 6 },
    ]).success,
    false
  )
})
test("client prices, fractional quantities and empty carts are rejected", () => {
  for (const value of [
    [],
    [{ variantId: "a", quantity: 1.5 }],
    [{ variantId: "a", quantity: 1, price: 1 }],
  ])
    assert.equal(cartInput.safeParse(value).success, false)
})
test("order requires a valid idempotency key, contact and Indian address", () => {
  const input = {
    idempotencyKey: "bf6d01b5-b7fc-43e6-9355-0d32a016fb32",
    items: [{ variantId: "a", quantity: 1 }],
    expectedTotalMinor: 120000,
    customer: {
      name: "Test Person",
      email: "TEST@example.com",
      phone: "9999999999",
    },
    address: {
      line1: "Test street 123",
      city: "Indore",
      state: "MP",
      postalCode: "452001",
      country: "IN",
    },
  }
  assert.equal(orderInput.parse(input).customer.email, "test@example.com")
  assert.equal(
    orderInput.safeParse({ ...input, idempotencyKey: "bad" }).success,
    false
  )
  assert.equal(
    orderInput.safeParse({
      ...input,
      address: { ...input.address, postalCode: "000000" },
    }).success,
    false
  )
})
test("delivery threshold uses integer paise", () => {
  assert.equal(shippingMinor(59899), 9900)
  assert.equal(shippingMinor(59900), 0)
  assert.equal(shippingMinor(60000), 0)
})

test("checkout identifies invalid address and phone without echoing private values", () => {
  const result = orderInput.safeParse({
    idempotencyKey: "bf6d01b5-b7fc-43e6-9355-0d32a016fb32",
    items: [{ variantId: "a", quantity: 1 }],
    expectedTotalMinor: 63800,
    customer: {
      name: "Test Person",
      email: "test@example.com",
      phone: "notaphone!",
    },
    address: {
      line1: "213",
      city: "Indore",
      state: "MP",
      postalCode: "452001",
      country: "IN",
    },
  })
  assert.equal(result.success, false)
  if (!result.success) {
    const message = checkoutValidationMessage(result.error)
    assert.match(message, /phone number/)
    assert.match(message, /complete street address/)
    assert.ok(!message.includes("notaphone!"))
    assert.ok(!message.includes("213"))
  }
})
test("demo checkout cannot be enabled outside development", () => {
  const previous = { mode: process.env.CHECKOUT_MODE, env: process.env.APP_ENV }
  try {
    process.env.CHECKOUT_MODE = "demo"
    process.env.APP_ENV = "production"
    assert.equal(checkoutMode(), "disabled")
  } finally {
    if (previous.mode === undefined) delete process.env.CHECKOUT_MODE
    else process.env.CHECKOUT_MODE = previous.mode
    if (previous.env === undefined) delete process.env.APP_ENV
    else process.env.APP_ENV = previous.env
  }
})
