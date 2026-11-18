const BYTES_TAG = "__bytes"

function toBase64(bytes: Uint8Array): string {
  let text = ""
  for (let i = 0; i < bytes.length; i += 0x8000) text += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return btoa(text)
}

function fromBase64(text: string): Uint8Array<ArrayBuffer> {
  const raw = atob(text)
  const bytes = new Uint8Array(new ArrayBuffer(raw.length))
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i)
  return bytes
}

/** Rows hold sealed bytes (the keyring box, receipt blobs) that JSON cannot carry on its own. */
export function encodeRow(row: unknown): string {
  return JSON.stringify(row, function (key, value) {
    const original = (this as Record<string, unknown>)[key]
    if (original instanceof ArrayBuffer) return { [BYTES_TAG]: toBase64(new Uint8Array(original)), buffer: true }
    if (ArrayBuffer.isView(original)) return { [BYTES_TAG]: toBase64(new Uint8Array(original.buffer, original.byteOffset, original.byteLength)) }
    return value
  })
}

export function decodeRow<T>(text: string): T {
  return JSON.parse(text, (_key, value) => {
    if (value && typeof value === "object" && typeof value[BYTES_TAG] === "string") {
      const bytes = fromBase64(value[BYTES_TAG])
      return value.buffer ? bytes.buffer : bytes
    }
    return value
  }) as T
}
