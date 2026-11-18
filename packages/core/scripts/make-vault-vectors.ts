/**
 * Writes shared/test-vectors/vault-*.json from the current implementation (T-mobile-app Phase 3).
 * Run once; the files are then the contract every client must pass, and running it again would
 * replace frozen ciphertext, so only do that when the format itself changes (with an ADR).
 */
import { writeFileSync } from "node:fs"
import { gzipSync } from "node:zlib"

import {
  createAccountKeys, deterministicId, derivePasswordKeys, fromBase64Url, normaliseIdentifier, recoveryCodeFrom, sealField, toBase64Url,
  wrapForMember, wrapUserKeyForPassword, wrapUserKeyForRecovery,
} from "../src/vault/crypto.ts"
import { encryptBytes } from "../src/attachments/crypto.ts"
import { deriveBackupKey, encryptBackup, SALT_BYTES } from "../src/backup/format.ts"
import { secretFromPin, wrapDataKey } from "../src/lock/crypto.ts"

const OUT = new URL("../../../shared/test-vectors/", import.meta.url)
const write = (name: string, cases: unknown[]) => writeFileSync(new URL(`${name}.json`, OUT), JSON.stringify(cases, null, 2) + "\n")
const bytes = (length: number, start: number) => new Uint8Array(Array.from({ length }, (_, i) => (start + i * 7) & 0xff))
const aes = (raw: Uint8Array) => crypto.subtle.importKey("raw", raw, { name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"])
const ecdh = { name: "ECDH", namedCurve: "P-256" }
const hex = (b: ArrayBuffer | Uint8Array): string => Buffer.from(b instanceof Uint8Array ? b : new Uint8Array(b)).toString("hex")

const IDENTIFIERS: [string, string][] = [
  ["email is trimmed and lower-cased", "  Ali.Hassan@Example.IQ "],
  ["local mobile number gains the country code", "0770 123 4567"],
  ["mobile number with dashes and brackets", "(0780)-555-1234"],
  ["number already in international form", "+9647701234567"],
  ["short number is kept as digits", "123 456"],
]
write("vault-identifiers", IDENTIFIERS.map(([name, raw]) => ({ name, input: raw, expected: normaliseIdentifier(raw) })))

const PASSWORDS: [string, string, string][] = [
  ["plain ASCII password", "ali@example.iq", "correct horse battery staple"],
  ["Arabic password with presentation forms is NFKC-normalised", "0770 123 4567", "ﻻ كلمة-سر ١٢٣"],
  ["Latin ligature and accents", "Sara@Example.IQ", "Pässwörd ﬁne"],
]
const passwordCases = []
for (const [name, identifier, password] of PASSWORDS) {
  const keys = await derivePasswordKeys(identifier, password)
  passwordCases.push({ name, input: { identifier, password }, expected: { authKey: keys.authKey, wrapSecret: toBase64Url(keys.wrapSecret) } })
}
write("vault-password-keys", passwordCases)

const recoveryCases = [
  { name: "all zero bytes", input: hex(new Uint8Array(20)) },
  { name: "all 0xff bytes", input: hex(new Uint8Array(20).fill(0xff)) },
  { name: "a counting pattern", input: hex(bytes(20, 3)) },
].map((c) => ({ ...c, expected: recoveryCodeFrom(Buffer.from(c.input, "hex")) }))
write("vault-recovery-codes", recoveryCases)

const userKeyRaw = bytes(32, 11)
const wrapSecret = (await derivePasswordKeys(PASSWORDS[0][1], PASSWORDS[0][2])).wrapSecret
const recoveryCode = recoveryCodeFrom(bytes(20, 5))
write("vault-key-wrapping", [
  { name: "user key wrapped by the password's wrap secret (AES-KW, deterministic)", input: { userKey: toBase64Url(userKeyRaw), wrapSecret: toBase64Url(wrapSecret) }, expected: await wrapUserKeyForPassword(await aes(userKeyRaw), wrapSecret) },
  { name: "user key wrapped by the recovery code", input: { userKey: toBase64Url(userKeyRaw), recoveryCode }, expected: await wrapUserKeyForRecovery(await aes(userKeyRaw), recoveryCode) },
  { name: "the recovery code is read ignoring case, spaces and dashes", input: { userKey: toBase64Url(userKeyRaw), recoveryCode: recoveryCode.toLowerCase().replace(/-/g, " ") }, expected: await wrapUserKeyForRecovery(await aes(userKeyRaw), recoveryCode) },
])

const created = await createAccountKeys(wrapSecret)
const accountUserKey = toBase64Url(await crypto.subtle.exportKey("raw", created.account.userKey))
const accountPrivate = toBase64Url(await crypto.subtle.exportKey("pkcs8", created.account.privateKey))
const peer = await crypto.subtle.generateKey(ecdh, true, ["deriveBits"]) as CryptoKeyPair
const peerPublicKey = toBase64Url(await crypto.subtle.exportKey("spki", peer.publicKey))
const sharedWithPeer = toBase64Url(await crypto.subtle.deriveBits({ name: "ECDH", public: peer.publicKey }, created.account.privateKey, 256))
write("vault-account", [{
  name: "an account opens with its password and with its recovery code; its private key agrees with a fixed peer",
  input: { identifier: PASSWORDS[0][1], password: PASSWORDS[0][2], recoveryCode: created.recoveryCode, material: created.material, peerPublicKey },
  expected: { userKey: accountUserKey, publicKey: created.material.publicKey, sharedWithPeer },
}])

const householdRaw = bytes(32, 101)
const reportRaw = bytes(32, 151)
write("vault-grants", [
  { name: "household key version 1 granted to the account", input: { kind: "HOUSEHOLD", version: 1, privateKeyPkcs8: accountPrivate, wrapped: await wrapForMember(await aes(householdRaw), created.material.publicKey, "HOUSEHOLD", 1) }, expected: { key: toBase64Url(householdRaw), opensAsVersion2: false } },
  { name: "report key version 3", input: { kind: "REPORT", version: 3, privateKeyPkcs8: accountPrivate, wrapped: await wrapForMember(await aes(reportRaw), created.material.publicKey, "REPORT", 3) }, expected: { key: toBase64Url(reportRaw), opensAsVersion2: false } },
])

const FIELDS: [string, string, string, string, unknown][] = [
  ["an amount in minor units", "ledger_transaction", "row-1", "amount", 12345678901],
  ["an Arabic payee", "ledger_transaction", "row-1", "payee", "شاي وسكر ١٢٣"],
  ["an object with null inside", "annual_report", "rep-2026", "report", { months: [{ monthKey: "2026-01", received: 1500000 }], savingRate: null }],
  ["null", "ledger_transaction", "row-2", "note", null],
  ["a value that fills a pad block exactly", "ledger_transaction", "row-3", "note", "x".repeat(29)],
  ["a long note", "ledger_transaction", "row-3", "category", "y".repeat(100)],
]
const fieldCases = []
for (const [name, table, recordId, field, value] of FIELDS) {
  const kind = table === "annual_report" ? "r" : name === "null" ? "u" : "h"
  const keyRaw = kind === "r" ? reportRaw : kind === "u" ? userKeyRaw : householdRaw
  const version = kind === "u" ? 1 : kind === "r" ? 3 : 1
  const sealed = await sealField({ kind, version, key: await aes(keyRaw) }, table, recordId, field, value)
  fieldCases.push({ name, input: { key: toBase64Url(keyRaw), table, recordId, field, sealed }, expected: { value, kind, version, sealedBytes: fromBase64Url(sealed.split(".")[3]).length } })
}
write("vault-fields", fieldCases)

write("vault-ids", await Promise.all([
  ["member contribution", ["member_contribution", "household-1", "user-1"]],
  ["month close", ["month_close", "household-1", "2026-10"]],
  ["default bucket", ["default_bucket", "household-1", "0"]],
  ["annual report with Arabic household id", ["annual_report", "أسرة", "2026"]],
].map(async ([name, parts]) => ({ name, input: parts, expected: await deterministicId(...(parts as string[])) }))))

const plainFile = new TextEncoder().encode("receipt photo bytes ١٢٣")
const file = await encryptBytes(plainFile.buffer as ArrayBuffer)
const backupSalt = bytes(SALT_BYTES, 9)
const backupIv = bytes(12, 77)
const backupJson = JSON.stringify({ format: "mizan-export", note: "نسخة احتياطية" })
const backup = await encryptBackup(backupJson, await deriveBackupKey("correct horse", backupSalt, 1000), backupSalt, 1000, backupIv, { gzip: (b) => gzipSync(b), gunzip: () => { throw new Error("not used when writing") } })
const lockKeyRaw = bytes(32, 201)
const lock = await wrapDataKey(await aes(lockKeyRaw), secretFromPin("2580"))
write("vault-device-files", [
  { name: "a receipt file opens with its own key", input: { kind: "attachment", iv: file.iv, blobKey: file.blobKey, cipher: toBase64Url(file.cipher) }, expected: { plain: toBase64Url(plainFile) } },
  { name: "an MZB1 backup opens with its passphrase (gzip inside)", input: { kind: "backup", passphrase: "correct horse", iv: toBase64Url(backupIv), bytes: toBase64Url(backup) }, expected: { json: backupJson, wrongPassphrase: "WRONG_PASSPHRASE" } },
  { name: "the PIN-wrapped data key opens with the PIN only", input: { kind: "lock", pin: "2580", wrongPin: "0000", entry: lock }, expected: { key: toBase64Url(lockKeyRaw) } },
])
console.log("wrote vault vectors")
