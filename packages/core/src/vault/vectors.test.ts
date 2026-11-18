import { gunzipSync, gzipSync } from "node:zlib"

import account from "../../../../shared/test-vectors/vault-account.json"
import deviceFiles from "../../../../shared/test-vectors/vault-device-files.json"
import fields from "../../../../shared/test-vectors/vault-fields.json"
import grants from "../../../../shared/test-vectors/vault-grants.json"
import identifiers from "../../../../shared/test-vectors/vault-identifiers.json"
import ids from "../../../../shared/test-vectors/vault-ids.json"
import keyWrapping from "../../../../shared/test-vectors/vault-key-wrapping.json"
import passwordKeys from "../../../../shared/test-vectors/vault-password-keys.json"
import recoveryCodes from "../../../../shared/test-vectors/vault-recovery-codes.json"
import { decryptWithKey, fileKey } from "../attachments/crypto"
import { decryptBackup } from "../backup/format"
import { secretFromPin, unwrapDataKey } from "../lock/crypto"
import {
  deterministicId, derivePasswordKeys, fromBase64Url, normaliseIdentifier, openAccountWithPassword, openAccountWithRecovery, openField, openGrant,
  readHeader, recoveryCodeFrom, sealField, toBase64Url, wrapUserKeyForPassword, wrapUserKeyForRecovery, type AccountKeyMaterial, type KeyKind, type SealKind,
} from "./crypto"

/*
 * ADR mobile-1: every client runs these files. Exact cases pin bytes; "opens" cases carry
 * ciphertext made once by the web implementation, which every client must open to the same value.
 */
const ecdh = { name: "ECDH", namedCurve: "P-256" }
const aes = (raw: string) => crypto.subtle.importKey("raw", fromBase64Url(raw), { name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"])
const rawOf = async (key: CryptoKey) => toBase64Url(await crypto.subtle.exportKey("raw", key))
const privateKey = (pkcs8: string) => crypto.subtle.importKey("pkcs8", fromBase64Url(pkcs8), ecdh, true, ["deriveBits"])

describe("vault vectors", () => {
  it.each(identifiers)("identifier: $name", ({ input, expected }) => {
    expect(normaliseIdentifier(input)).toBe(expected)
  })

  it.each(passwordKeys)("password keys: $name", async ({ input, expected }) => {
    const keys = await derivePasswordKeys(input.identifier, input.password)
    expect({ authKey: keys.authKey, wrapSecret: toBase64Url(keys.wrapSecret) }).toEqual(expected)
  })

  it.each(recoveryCodes)("recovery code: $name", ({ input, expected }) => {
    expect(recoveryCodeFrom(Uint8Array.from(Buffer.from(input, "hex")))).toBe(expected)
  })

  it.each(keyWrapping)("key wrapping: $name", async ({ input, expected }) => {
    const userKey = await aes(input.userKey)
    const wrapped = "wrapSecret" in input && input.wrapSecret
      ? await wrapUserKeyForPassword(userKey, fromBase64Url(input.wrapSecret))
      : await wrapUserKeyForRecovery(userKey, (input as { recoveryCode: string }).recoveryCode)
    expect(wrapped).toBe(expected)
  })

  it.each(account)("account: $name", async ({ input, expected }) => {
    const material = input.material as AccountKeyMaterial
    const byPassword = await openAccountWithPassword(material, (await derivePasswordKeys(input.identifier, input.password)).wrapSecret)
    const byRecovery = await openAccountWithRecovery(material, input.recoveryCode.toLowerCase())
    expect(byPassword && (await rawOf(byPassword.userKey))).toBe(expected.userKey)
    expect(byRecovery && (await rawOf(byRecovery.userKey))).toBe(expected.userKey)
    expect(byPassword?.publicKey).toBe(expected.publicKey)
    const peer = await crypto.subtle.importKey("spki", fromBase64Url(input.peerPublicKey), ecdh, true, [])
    expect(toBase64Url(await crypto.subtle.deriveBits({ name: "ECDH", public: peer }, byPassword!.privateKey, 256))).toBe(expected.sharedWithPeer)
    expect(await openAccountWithPassword(material, (await derivePasswordKeys(input.identifier, "not the password")).wrapSecret)).toBeNull()
  })

  it.each(grants)("grant: $name", async ({ input, expected }) => {
    const key = await privateKey(input.privateKeyPkcs8)
    const opened = await openGrant(input.wrapped, key, input.kind as KeyKind, input.version)
    expect(opened && (await rawOf(opened))).toBe(expected.key)
    expect(await openGrant(input.wrapped, key, input.kind as KeyKind, input.version + 1)).toBeNull()
  })

  it.each(fields)("field: $name", async ({ input, expected }) => {
    const key = await aes(input.key)
    const header = readHeader(input.sealed)!
    expect({ kind: header.kind, version: header.version }).toEqual({ kind: expected.kind, version: expected.version })
    expect(await openField(key, header, input.table, input.recordId, input.field)).toEqual(expected.value)
    await expect(openField(key, header, input.table, `${input.recordId}-moved`, input.field)).rejects.toThrow()
    const resealed = await sealField({ kind: expected.kind as SealKind, version: expected.version, key }, input.table, input.recordId, input.field, expected.value)
    expect(fromBase64Url(resealed.split(".")[3]).length).toBe(expected.sealedBytes)
  })

  it.each(ids)("deterministic id: $name", async ({ input, expected }) => {
    expect(await deterministicId(...input)).toBe(expected)
  })

  it.each(deviceFiles)("device file: $name", async ({ input, expected }) => {
    if (input.kind === "attachment") {
      const plain = await decryptWithKey(fromBase64Url(input.cipher!).buffer as ArrayBuffer, input.iv!, await fileKey(input.blobKey!))
      expect(toBase64Url(plain)).toBe(expected.plain)
    }
    if (input.kind === "backup") {
      const zlib = { gzip: (b: Uint8Array) => gzipSync(b), gunzip: (b: Uint8Array) => gunzipSync(b) }
      expect(await decryptBackup(fromBase64Url(input.bytes!), input.passphrase!, fromBase64Url(input.iv!), zlib)).toBe(expected.json)
      await expect(decryptBackup(fromBase64Url(input.bytes!), "wrong", fromBase64Url(input.iv!), zlib)).rejects.toThrow(expected.wrongPassphrase)
    }
    if (input.kind === "lock") {
      const entry = input.entry!
      const opened = await unwrapDataKey(entry, secretFromPin(input.pin!))
      expect(opened && (await rawOf(opened))).toBe(expected.key)
      expect(await unwrapDataKey(entry, secretFromPin(input.wrongPin!))).toBeNull()
    }
  })
})
