import {
  createAccountKeys, derivePasswordKeys, deterministicId, fromBase64Url, newRecoveryCode, newSharedKey, normaliseIdentifier,
  openAccountWithPassword, openAccountWithRecovery, openField, openGrant, readHeader, sealField, toBase64Url, wrapForMember,
} from "../../../packages/core/src/vault/crypto.ts"
import type { AccountKeyMaterial } from "../../../packages/core/src/vault/crypto.ts"

export const A_PKCS8 = "MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgUFHbm4T7N9cUNesyBIYghhiTOumOi5yUA6F8Z_q2P2-hRANCAATZw2c53wYEBtYcV9CxRsXdysijiA5tpST3miTITOoyLkI3Ri1rU4NWiwyFgr8LjNsrXab-pCiX7nlMD7ISn_7Y"
export const A_SPKI = "MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE2cNnOd8GBAbWHFfQsUbF3crIo4gObaUk95okyEzqMi5CN0Yta1ODVosMhYK_C4zbK12m_qQol-55TA-yEp_-2A"
export const B_PKCS8 = "MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgDkjvyhoEiga56MmjddSQywZpz2VPqUWFB_dmXebqmqihRANCAARbAQOds3e5FY099cvPUnkRMOf3rSCEDnUbmcGfVSPm7SkNAJMPp7vnw9N7GXxnoGhRKqznuFbbsC6gJKzt5xOt"
export const B_SPKI = "MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEWwEDnbN3uRWNPfXLz1J5ETDn960ghA51G5nBn1Uj5u0pDQCTD6e758PTexl8Z6BoUSqs57hW27AuoCSs7ecTrQ"

export const IDENTIFIERS = ["  0770 123-4567 ", "User@Example.COM"]
export const PASSWORD = "ﻻ كلمة-سر ١٢٣ Pässwörd ﬁ"
export const FIELD_VALUES: unknown[] = [12345678901, "شاي وسكر ١٢٣", { lines: [1, 2.5], note: null }, null, "x".repeat(100)]
const FIXED_KEY = new Uint8Array(Array.from({ length: 32 }, (_, i) => i))
const FIXED_IV = new Uint8Array(Array.from({ length: 12 }, (_, i) => 200 + i))
const FIXED_SALT = new Uint8Array(Array.from({ length: 16 }, (_, i) => 100 + i))
const PLAIN = new TextEncoder().encode("Mizan حساب 2026")
const AAD = new TextEncoder().encode("e1|txn|rec-1|amount")
const QUICK_ITERATIONS = 1000

export interface Fixtures {
  material: AccountKeyMaterial
  recoveryCode: string
  accountPublicKey: string
  grant: string
  sealed: string[]
}

export type Kind = "exact" | "outbound"
export interface CaseResult { kind: Kind; ms: number; value?: unknown; error?: string }
export type Results = Record<string, CaseResult>

const subtle = () => crypto.subtle
const ecdh = { name: "ECDH", namedCurve: "P-256" }

async function importA() {
  return subtle().importKey("pkcs8", fromBase64Url(A_PKCS8), ecdh, true, ["deriveBits"])
}

async function importB() {
  return subtle().importKey("spki", fromBase64Url(B_SPKI), ecdh, true, [])
}

async function rawOf(key: CryptoKey) {
  return toBase64Url(await subtle().exportKey("raw", key))
}

function rawCases(): Record<string, () => Promise<unknown>> {
  return {
    sha256: async () => toBase64Url(await subtle().digest("SHA-256", PLAIN)),
    aesGcmWithAad: async () => {
      const key = await subtle().importKey("raw", FIXED_KEY, "AES-GCM", false, ["encrypt", "decrypt"])
      const sealed = await subtle().encrypt({ name: "AES-GCM", iv: FIXED_IV, additionalData: AAD }, key, PLAIN)
      const opened = new TextDecoder().decode(await subtle().decrypt({ name: "AES-GCM", iv: FIXED_IV, additionalData: AAD }, key, sealed))
      let wrongAad = "accepted"
      try {
        await subtle().decrypt({ name: "AES-GCM", iv: FIXED_IV, additionalData: new TextEncoder().encode("e1|txn|rec-2|amount") }, key, sealed)
      } catch {
        wrongAad = "rejected"
      }
      return { sealed: toBase64Url(sealed), opened, wrongAad }
    },
    aesGcmNoAad: async () => {
      const key = await subtle().importKey("raw", FIXED_KEY, { name: "AES-GCM" }, false, ["encrypt"])
      return toBase64Url(await subtle().encrypt({ name: "AES-GCM", iv: FIXED_IV }, key, PLAIN))
    },
    lockKeyWrap: async () => {
      const material = await subtle().importKey("raw", new TextEncoder().encode("1234"), "PBKDF2", false, ["deriveKey"])
      const wrapping = await subtle().deriveKey({ name: "PBKDF2", salt: FIXED_SALT, iterations: QUICK_ITERATIONS, hash: "SHA-256" },
        material, { name: "AES-KW", length: 256 }, false, ["wrapKey", "unwrapKey"])
      const data = await subtle().importKey("raw", FIXED_KEY, { name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"])
      const wrapped = await subtle().wrapKey("raw", data, wrapping, "AES-KW")
      const back = await subtle().unwrapKey("raw", wrapped, wrapping, "AES-KW", { name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"])
      return { wrapped: toBase64Url(wrapped), unwrapped: await rawOf(back) }
    },
    backupKeyJwk: async () => {
      const material = await subtle().importKey("raw", new TextEncoder().encode("ﻻ backup".normalize("NFKC")), "PBKDF2", false, ["deriveKey"])
      const key = await subtle().deriveKey({ name: "PBKDF2", salt: FIXED_SALT, iterations: QUICK_ITERATIONS, hash: "SHA-256" },
        material, { name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"])
      const jwk = await subtle().exportKey("jwk", key)
      const again = await subtle().importKey("jwk", jwk, { name: "AES-GCM" }, true, ["encrypt", "decrypt"])
      const sealed = await subtle().encrypt({ name: "AES-GCM", iv: FIXED_IV }, again, PLAIN)
      return { k: jwk.k, kty: jwk.kty, alg: jwk.alg, sealed: toBase64Url(sealed) }
    },
    ecdhImportExport: async () => {
      const a = await importA()
      const b = await importB()
      const jwk = await subtle().exportKey("jwk", a)
      const fromJwk = await subtle().importKey("jwk", jwk, ecdh, true, ["deriveBits"])
      const shared = await subtle().deriveBits({ name: "ECDH", public: b }, a, 256)
      const sharedFromJwk = await subtle().deriveBits({ name: "ECDH", public: b }, fromJwk, 256)
      const bRaw = await subtle().exportKey("raw", b)
      const bFromRaw = await subtle().importKey("raw", bRaw, ecdh, true, [])
      return {
        jwk: { kty: jwk.kty, crv: jwk.crv, d: jwk.d, x: jwk.x, y: jwk.y },
        shared: toBase64Url(shared), sharedFromJwk: toBase64Url(sharedFromJwk),
        bRaw: toBase64Url(bRaw), bSpkiAgain: toBase64Url(await subtle().exportKey("spki", bFromRaw)),
      }
    },
    deviceKeyNonExtractable: async () => {
      const key = await subtle().generateKey({ name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"])
      const sealed = await subtle().encrypt({ name: "AES-GCM", iv: FIXED_IV }, key, PLAIN)
      const opened = new TextDecoder().decode(await subtle().decrypt({ name: "AES-GCM", iv: FIXED_IV }, key, sealed))
      let exported = "allowed"
      try {
        await subtle().exportKey("raw", key)
      } catch {
        exported = "refused"
      }
      return { opened, exported }
    },
    randomness: async () => {
      const bytes = crypto.getRandomValues(new Uint8Array(32))
      const uuid = crypto.randomUUID()
      return { bytes: bytes.length, anyNonZero: bytes.some((b) => b !== 0), uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(uuid) }
    },
  }
}

function vaultCases(f: Fixtures): Record<string, () => Promise<unknown>> {
  return {
    normaliseIdentifier: async () => IDENTIFIERS.map(normaliseIdentifier),
    nfkc: async () => [...PASSWORD.normalize("NFKC")].map((c) => c.codePointAt(0)!.toString(16)),
    derivePasswordKeys: async () => {
      const keys = await derivePasswordKeys(IDENTIFIERS[0], PASSWORD)
      return { authKey: keys.authKey, wrapSecret: toBase64Url(keys.wrapSecret) }
    },
    deterministicId: async () => deterministicId("member_contribution", "hh-1", "user-1"),
    openAccountWithPassword: async () => {
      const keys = await derivePasswordKeys(IDENTIFIERS[1], PASSWORD)
      const account = await openAccountWithPassword(f.material, keys.wrapSecret)
      if (!account) return null
      return { userKey: await rawOf(account.userKey), ecdhWithB: toBase64Url(await subtle().deriveBits({ name: "ECDH", public: await importB() }, account.privateKey, 256)) }
    },
    openAccountWithRecovery: async () => {
      const account = await openAccountWithRecovery(f.material, f.recoveryCode.toLowerCase().replace(/-/g, " "))
      return account ? await rawOf(account.userKey) : null
    },
    openGrantAndFields: async () => {
      const keys = await derivePasswordKeys(IDENTIFIERS[1], PASSWORD)
      const account = await openAccountWithPassword(f.material, keys.wrapSecret)
      const household = account && await openGrant(f.grant, account.privateKey, "HOUSEHOLD", 3)
      if (!household) return null
      const fields = []
      for (const text of f.sealed) fields.push(await openField(household, readHeader(text)!, "txn", "rec-1", "amount"))
      const wrongVersion = await openGrant(f.grant, account.privateKey, "HOUSEHOLD", 4)
      return { household: await rawOf(household), fields, wrongVersion: wrongVersion === null ? "rejected" : "accepted" }
    },
  }
}

function outboundCases(f: Fixtures): Record<string, () => Promise<unknown>> {
  return {
    createAccount: async () => {
      const keys = await derivePasswordKeys(IDENTIFIERS[1], PASSWORD)
      const { material, recoveryCode, account } = await createAccountKeys(keys.wrapSecret)
      return { material, recoveryCode, userKey: await rawOf(account.userKey) }
    },
    grantAndSealToNode: async () => {
      const household = await newSharedKey()
      const grant = await wrapForMember(household, f.accountPublicKey, "HOUSEHOLD", 7)
      const sealed = []
      for (const value of FIELD_VALUES) sealed.push(await sealField({ kind: "h", version: 7, key: household }, "txn", "rec-9", "note", value))
      return { grant, sealed, household: await rawOf(household) }
    },
    recoveryCode: async () => newRecoveryCode(),
  }
}

async function timed(kind: Kind, run: () => Promise<unknown>): Promise<CaseResult> {
  const start = Date.now()
  try {
    const value = await run()
    return { kind, ms: Date.now() - start, value }
  } catch (e) {
    return { kind, ms: Date.now() - start, error: e instanceof Error ? `${e.name}: ${e.message}` : String(e) }
  }
}

export async function runAll(f: Fixtures, onCase?: (name: string, result: CaseResult) => void): Promise<Results> {
  const results: Results = {}
  const groups: [Kind, Record<string, () => Promise<unknown>>][] = [["exact", rawCases()], ["exact", vaultCases(f)], ["outbound", outboundCases(f)]]
  for (const [kind, cases] of groups) {
    for (const [name, run] of Object.entries(cases)) {
      results[name] = await timed(kind, run)
      onCase?.(name, results[name])
    }
  }
  return results
}

export async function makeFixtures(): Promise<{ fixtures: Fixtures; accountPrivateKey: CryptoKey }> {
  const keys = await derivePasswordKeys(IDENTIFIERS[1], PASSWORD)
  const { material, recoveryCode, account } = await createAccountKeys(keys.wrapSecret)
  const household = await newSharedKey()
  const grant = await wrapForMember(household, account.publicKey, "HOUSEHOLD", 3)
  const sealed = []
  for (const value of FIELD_VALUES) sealed.push(await sealField({ kind: "h", version: 3, key: household }, "txn", "rec-1", "amount", value))
  return { fixtures: { material, recoveryCode, accountPublicKey: account.publicKey, grant, sealed }, accountPrivateKey: account.privateKey }
}
