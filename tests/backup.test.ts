import { test } from "node:test"
import assert from "node:assert/strict"
import { randomBytes } from "node:crypto"
import { encryptBackup, decryptBackup } from "../lib/backup"
test("backup encryption roundtrips and rejects modified data or the wrong key", () => {
  const key = randomBytes(32).toString("base64")
  const data = JSON.stringify({ private: "synthetic customer record" })
  const encrypted = encryptBackup(data, key)
  assert.equal(decryptBackup(encrypted, key), data)
  assert.ok(!encrypted.includes("synthetic customer"))
  assert.throws(() =>
    decryptBackup(encrypted, randomBytes(32).toString("base64"))
  )
  const modified = JSON.parse(encrypted)
  modified.data = Buffer.from("tampered").toString("base64")
  assert.throws(() => decryptBackup(JSON.stringify(modified), key))
})
