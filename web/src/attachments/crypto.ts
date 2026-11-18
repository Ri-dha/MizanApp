import { META_KEYS, readMeta, writeMeta } from "@mizan/core/db/meta"
import { decryptWithKey, fileKey } from "@mizan/core/attachments/crypto"
import { currentDataKey } from "@/lock/store"

export { encryptBytes, fromBase64 } from "@mizan/core/attachments/crypto"

const RAW_KEY = "attachments.rawKey"

/**
 * The key receipts are encrypted with. Behind a PIN it is the wrapped data key; without one
 * it has to live unwrapped on the device, which is the trade-off of skipping the lock.
 */
export async function ensureDataKey(): Promise<CryptoKey> {
  const locked = currentDataKey()
  if (locked) return locked
  const stored = await readMeta<JsonWebKey>(RAW_KEY)
  if (stored) return crypto.subtle.importKey("jwk", stored, { name: "AES-GCM" }, true, ["encrypt", "decrypt"])
  const key = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"])
  await writeMeta(RAW_KEY, await crypto.subtle.exportKey("jwk", key))
  return key
}

/** Files from before ADR e2e-1 have no key of their own and were sealed with this device's. */
export async function decryptBytes(cipher: ArrayBuffer, iv: string, blobKey?: string | null): Promise<ArrayBuffer> {
  return decryptWithKey(cipher, iv, blobKey ? await fileKey(blobKey) : await ensureDataKey())
}

export { META_KEYS }
