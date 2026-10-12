import { randomBytes, createCipheriv, createDecipheriv } from "node:crypto"
function key(value: string) {
  const bytes = Buffer.from(value, "base64")
  if (bytes.length !== 32)
    throw new Error(
      "BACKUP_ENCRYPTION_KEY must contain 32 random bytes encoded as base64."
    )
  return bytes
}
export function encryptBackup(data: string, secret: string) {
  const iv = randomBytes(12)
  const cipher = createCipheriv("aes-256-gcm", key(secret), iv)
  const encrypted = Buffer.concat([cipher.update(data, "utf8"), cipher.final()])
  return JSON.stringify({
    version: 1,
    iv: iv.toString("base64"),
    tag: cipher.getAuthTag().toString("base64"),
    data: encrypted.toString("base64"),
  })
}
export function decryptBackup(data: string, secret: string) {
  const parsed = JSON.parse(data)
  if (parsed.version !== 1) throw new Error("Unsupported backup version")
  const decipher = createDecipheriv(
    "aes-256-gcm",
    key(secret),
    Buffer.from(parsed.iv, "base64")
  )
  decipher.setAuthTag(Buffer.from(parsed.tag, "base64"))
  return Buffer.concat([
    decipher.update(Buffer.from(parsed.data, "base64")),
    decipher.final(),
  ]).toString("utf8")
}
