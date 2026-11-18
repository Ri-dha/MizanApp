const IV_BYTES = 12

function toBase64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
}

export function fromBase64(text: string): Uint8Array<ArrayBuffer> {
  const raw = atob(text)
  const bytes = new Uint8Array(new ArrayBuffer(raw.length))
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i)
  return bytes
}

/** ADR e2e-1: each file has its own key, carried sealed in its attachment row. */
export async function encryptBytes(plain: ArrayBuffer): Promise<{ iv: string; cipher: ArrayBuffer; blobKey: string }> {
  const key = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"])
  const iv = crypto.getRandomValues(new Uint8Array(new ArrayBuffer(IV_BYTES)))
  const cipher = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plain)
  return { iv: toBase64(iv), cipher, blobKey: toBase64(new Uint8Array(await crypto.subtle.exportKey("raw", key))) }
}

export async function decryptWithKey(cipher: ArrayBuffer, iv: string, key: CryptoKey): Promise<ArrayBuffer> {
  return crypto.subtle.decrypt({ name: "AES-GCM", iv: fromBase64(iv) }, key, cipher)
}

export async function fileKey(blobKey: string): Promise<CryptoKey> {
  return crypto.subtle.importKey("raw", fromBase64(blobKey), { name: "AES-GCM" }, false, ["decrypt"])
}
