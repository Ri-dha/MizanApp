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
import { decryptBackup, type Compression } from "../backup/format"
import { secretFromPin, unwrapDataKey } from "../lock/crypto"
import {
  deterministicId, derivePasswordKeys, fromBase64Url, normaliseIdentifier, openAccountWithPassword, openAccountWithRecovery, openField, openGrant,
  readHeader, recoveryCodeFrom, sealField, toBase64Url, wrapUserKeyForPassword, wrapUserKeyForRecovery, type AccountKeyMaterial, type KeyKind, type SealKind,
} from "./crypto"

/*
 * ADR mobile-1: every client runs these checks over shared/test-vectors/vault-*.json. Exact cases
 * pin bytes; "opens" cases carry ciphertext made once by the web, which every client must open.
 */
export interface VectorCheck {
  file: string
  name: string
  run: () => Promise<void>
}

class Mismatch extends Error {}

function same(actual: unknown, expected: unknown, what: string) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Mismatch(`${what}: got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`)
}

async function rejects(promise: Promise<unknown>, what: string, message?: string) {
  try {
    await promise
  } catch (error) {
    if (message && !(error instanceof Error && error.message.includes(message))) throw new Mismatch(`${what}: failed with ${String(error)}`)
    return
  }
  throw new Mismatch(`${what}: was accepted`)
}

const ecdh = { name: "ECDH", namedCurve: "P-256" }
const aes = (raw: string) => crypto.subtle.importKey("raw", fromBase64Url(raw), { name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"])
const rawOf = async (key: CryptoKey | null) => (key ? toBase64Url(await crypto.subtle.exportKey("raw", key)) : null)
const hexBytes = (hex: string) => new Uint8Array(hex.match(/../g)!.map((pair) => parseInt(pair, 16)))

export function vaultVectorChecks(compression: Compression): VectorCheck[] {
  const checks: VectorCheck[] = []
  const add = (file: string, name: string, run: () => Promise<void>) => checks.push({ file, name, run })

  for (const v of identifiers) add("identifiers", v.name, async () => same(normaliseIdentifier(v.input), v.expected, "normalised"))
  for (const v of passwordKeys) add("password-keys", v.name, async () => {
    const keys = await derivePasswordKeys(v.input.identifier, v.input.password)
    same({ authKey: keys.authKey, wrapSecret: toBase64Url(keys.wrapSecret) }, v.expected, "keys")
  })
  for (const v of recoveryCodes) add("recovery-codes", v.name, async () => same(recoveryCodeFrom(hexBytes(v.input)), v.expected, "code"))
  for (const v of keyWrapping) add("key-wrapping", v.name, async () => {
    const userKey = await aes(v.input.userKey)
    const input = v.input as { wrapSecret?: string; recoveryCode?: string }
    const wrapped = input.wrapSecret ? await wrapUserKeyForPassword(userKey, fromBase64Url(input.wrapSecret)) : await wrapUserKeyForRecovery(userKey, input.recoveryCode!)
    same(wrapped, v.expected, "wrapped")
  })
  for (const v of account) add("account", v.name, async () => {
    const material = v.input.material as AccountKeyMaterial
    const byPassword = await openAccountWithPassword(material, (await derivePasswordKeys(v.input.identifier, v.input.password)).wrapSecret)
    const byRecovery = await openAccountWithRecovery(material, v.input.recoveryCode.toLowerCase())
    same(await rawOf(byPassword?.userKey ?? null), v.expected.userKey, "user key by password")
    same(await rawOf(byRecovery?.userKey ?? null), v.expected.userKey, "user key by recovery code")
    same(byPassword?.publicKey, v.expected.publicKey, "public key")
    const peer = await crypto.subtle.importKey("spki", fromBase64Url(v.input.peerPublicKey), ecdh, true, [])
    same(toBase64Url(await crypto.subtle.deriveBits({ name: "ECDH", public: peer }, byPassword!.privateKey, 256)), v.expected.sharedWithPeer, "ECDH with peer")
    same(await openAccountWithPassword(material, (await derivePasswordKeys(v.input.identifier, "not the password")).wrapSecret), null, "wrong password")
  })
  for (const v of grants) add("grants", v.name, async () => {
    const key = await crypto.subtle.importKey("pkcs8", fromBase64Url(v.input.privateKeyPkcs8), ecdh, true, ["deriveBits"])
    same(await rawOf(await openGrant(v.input.wrapped, key, v.input.kind as KeyKind, v.input.version)), v.expected.key, "granted key")
    same(await openGrant(v.input.wrapped, key, v.input.kind as KeyKind, v.input.version + 1), null, "other version")
  })
  for (const v of fields) add("fields", v.name, async () => {
    const key = await aes(v.input.key)
    const header = readHeader(v.input.sealed)!
    same({ kind: header.kind, version: header.version }, { kind: v.expected.kind, version: v.expected.version }, "header")
    same(await openField(key, header, v.input.table, v.input.recordId, v.input.field), v.expected.value, "value")
    await rejects(openField(key, header, v.input.table, `${v.input.recordId}-moved`, v.input.field), "moved to another record")
    const resealed = await sealField({ kind: v.expected.kind as SealKind, version: v.expected.version, key }, v.input.table, v.input.recordId, v.input.field, v.expected.value)
    same(fromBase64Url(resealed.split(".")[3]).length, v.expected.sealedBytes, "padded length")
  })
  for (const v of ids) add("ids", v.name, async () => same(await deterministicId(...v.input), v.expected, "id"))
  for (const v of deviceFiles) add("device-files", v.name, async () => {
    const input = v.input as unknown as Record<string, string> & { entry?: { salt: string; wrapped: string } }
    const expected = v.expected as unknown as Record<string, string>
    if (input.kind === "attachment") {
      same(toBase64Url(await decryptWithKey(fromBase64Url(input.cipher).buffer as ArrayBuffer, input.iv, await fileKey(input.blobKey))), expected.plain, "file")
    } else if (input.kind === "backup") {
      same(await decryptBackup(fromBase64Url(input.bytes), input.passphrase, fromBase64Url(input.iv), compression), expected.json, "backup")
      await rejects(decryptBackup(fromBase64Url(input.bytes), "wrong", fromBase64Url(input.iv), compression), "wrong passphrase", expected.wrongPassphrase)
    } else {
      same(await rawOf(await unwrapDataKey(input.entry!, secretFromPin(input.pin))), expected.key, "PIN key")
      same(await unwrapDataKey(input.entry!, secretFromPin(input.wrongPin)), null, "wrong PIN")
    }
  })
  return checks
}
