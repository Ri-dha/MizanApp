/** What a backup is compressed with; each app passes its own gzip so core keeps no dependency. */
export interface Compression {
  gzip(bytes: Uint8Array): Uint8Array
  gunzip(bytes: Uint8Array): Uint8Array
}

const MAGIC = new TextEncoder().encode("MZB1")
export const SALT_BYTES = 16
const encoder = new TextEncoder()

/** FR-DAT-05: the passphrase is separate from the PIN because the PIN's key never leaves this device. */
export async function deriveBackupKey(passphrase: string, salt: Uint8Array, iterations: number): Promise<CryptoKey> {
  const material = await crypto.subtle.importKey("raw", encoder.encode(passphrase.normalize("NFKC")), "PBKDF2", false, ["deriveKey"])
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: salt as BufferSource, iterations, hash: "SHA-256" },
    material, { name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"],
  )
}

/** magic | salt | iterations (uint32 BE) | ciphertext of gzip(export JSON); the IV rides on the attachment row. */
export async function encryptBackup(json: string, key: CryptoKey, salt: Uint8Array, iterations: number, iv: Uint8Array, compression: Compression): Promise<Uint8Array> {
  const cipher = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: iv as BufferSource }, key, compression.gzip(encoder.encode(json)) as BufferSource))
  const out = new Uint8Array(MAGIC.length + SALT_BYTES + 4 + cipher.length)
  out.set(MAGIC, 0)
  out.set(salt, MAGIC.length)
  new DataView(out.buffer).setUint32(MAGIC.length + SALT_BYTES, iterations)
  out.set(cipher, MAGIC.length + SALT_BYTES + 4)
  return out
}

export async function decryptBackup(bytes: Uint8Array, passphrase: string, iv: Uint8Array, compression: Compression): Promise<string> {
  if (bytes.length < MAGIC.length + SALT_BYTES + 4 || !MAGIC.every((b, i) => bytes[i] === b)) throw new Error("NOT_A_BACKUP")
  const salt = bytes.slice(MAGIC.length, MAGIC.length + SALT_BYTES)
  const iterations = new DataView(bytes.buffer, bytes.byteOffset).getUint32(MAGIC.length + SALT_BYTES)
  const key = await deriveBackupKey(passphrase, salt, iterations)
  let plain: ArrayBuffer
  try {
    plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: iv as BufferSource }, key, bytes.slice(MAGIC.length + SALT_BYTES + 4) as BufferSource)
  } catch {
    throw new Error("WRONG_PASSPHRASE")
  }
  return new TextDecoder().decode(compression.gunzip(new Uint8Array(plain)))
}

