import { gunzipSync, gzipSync } from "node:zlib"

import { decryptBackup, deriveBackupKey, encryptBackup, SALT_BYTES, type Compression } from "./format"

const zlib: Compression = { gzip: (bytes) => gzipSync(bytes), gunzip: (bytes) => gunzipSync(bytes) }

describe("backup format", () => {
  it("round-trips with any gzip and names the failure otherwise", async () => {
    const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES))
    const iv = crypto.getRandomValues(new Uint8Array(12))
    const json = JSON.stringify({ payee: "شاي", amount: 2500 })
    const bytes = await encryptBackup(json, await deriveBackupKey("correct horse", salt, 1000), salt, 1000, iv, zlib)
    expect(new TextDecoder().decode(bytes.slice(0, 4))).toBe("MZB1")
    await expect(decryptBackup(bytes, "correct horse", iv, zlib)).resolves.toBe(json)
    await expect(decryptBackup(bytes, "wrong", iv, zlib)).rejects.toThrow("WRONG_PASSPHRASE")
    await expect(decryptBackup(new Uint8Array([1, 2, 3]), "x", iv, zlib)).rejects.toThrow("NOT_A_BACKUP")
  })
})
