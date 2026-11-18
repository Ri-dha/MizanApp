import { api, ApiError, unwrap } from "../api/client"
import { deleteMeta, readMeta, writeMeta } from "../db/meta"
import { secretStore, type SealedBox } from "../platform/secretStore"
import {
  newSharedKey, openGrant, readHeader, toBase64Url, wrapForMember, type KeyKind, type OpenAccount, type SealedHeader, type SealKind, type SealTarget,
} from "./crypto"

const STORE_KEY = "vault.keyring"
const FIRST_VERSION = 1

interface SharedEntry {
  kind: KeyKind
  version: number
  key: CryptoKey
}

interface Keyring {
  account: OpenAccount
  shared: SharedEntry[]
}

type StoredKeyring = SealedBox

interface SerialisedKeyring {
  userKey: JsonWebKey
  privateKey: JsonWebKey
  publicKey: string
  shared: { kind: KeyKind; version: number; key: JsonWebKey }[]
}

let keyring: Keyring | null = null

async function persist() {
  if (!keyring) {
    await deleteMeta(STORE_KEY)
    return
  }
  const serialised: SerialisedKeyring = {
    userKey: await crypto.subtle.exportKey("jwk", keyring.account.userKey),
    privateKey: await crypto.subtle.exportKey("jwk", keyring.account.privateKey),
    publicKey: keyring.account.publicKey,
    shared: await Promise.all(keyring.shared.map(async (entry) => ({ kind: entry.kind, version: entry.version, key: await crypto.subtle.exportKey("jwk", entry.key) }))),
  }
  const box: StoredKeyring = await secretStore().seal(new TextEncoder().encode(JSON.stringify(serialised)))
  await writeMeta(STORE_KEY, box)
}

export async function loadKeyring(): Promise<boolean> {
  const stored = await readMeta<StoredKeyring>(STORE_KEY)
  if (!stored) return false
  try {
    const plain = await secretStore().open(stored)
    const data = JSON.parse(new TextDecoder().decode(plain)) as SerialisedKeyring
    const aes = (jwk: JsonWebKey) => crypto.subtle.importKey("jwk", jwk, { name: "AES-GCM" }, true, ["encrypt", "decrypt"])
    keyring = {
      account: {
        userKey: await aes(data.userKey),
        privateKey: await crypto.subtle.importKey("jwk", data.privateKey, { name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]),
        publicKey: data.publicKey,
      },
      shared: await Promise.all(data.shared.map(async (entry) => ({ kind: entry.kind, version: entry.version, key: await aes(entry.key) }))),
    }
    return true
  } catch {
    keyring = null
    return false
  }
}

export async function setAccount(account: OpenAccount) {
  keyring = { account, shared: keyring?.account.publicKey === account.publicKey ? keyring.shared : [] }
  await persist()
}

/** Another household's keys open nothing here; the account's own keys stay with the person. */
export async function dropSharedKeys() {
  if (!keyring) return
  keyring = { ...keyring, shared: [] }
  await persist()
}

/** What a change of household keeps: the account's own keys and the device secret that seals them. */
export function deviceMetaKeys(): string[] {
  return [STORE_KEY, ...secretStore().metaKeys]
}

export async function clearKeyring() {
  keyring = null
  await deleteMeta(STORE_KEY)
}

export function hasAccountKeys(): boolean {
  return keyring !== null
}

function latest(kind: KeyKind): SharedEntry | undefined {
  return keyring?.shared.filter((entry) => entry.kind === kind).sort((a, b) => b.version - a.version)[0]
}

export function holdsKey(kind: KeyKind): boolean {
  return latest(kind) !== undefined
}

const REPORT_TABLES: ReadonlySet<string> = new Set(["annual_report"])

/** Shared rows go under the household key (the report key for advisor-readable reports); private rows under the owner's own. */
export function sealTargetFor(table: string, visibility: string | undefined): SealTarget | null {
  if (!keyring) return null
  if (visibility === "PRIVATE") return { kind: "u", version: FIRST_VERSION, key: keyring.account.userKey }
  const entry = latest(REPORT_TABLES.has(table) ? "REPORT" : "HOUSEHOLD")
  return entry ? { kind: REPORT_TABLES.has(table) ? "r" : "h", version: entry.version, key: entry.key } : null
}

const KIND_OF: Record<SealKind, KeyKind | null> = { h: "HOUSEHOLD", r: "REPORT", u: null }

export function keyFor(header: SealedHeader): CryptoKey | null {
  if (!keyring) return null
  const kind = KIND_OF[header.kind]
  if (kind === null) return keyring.account.userKey
  return keyring.shared.find((entry) => entry.kind === kind && entry.version === header.version)?.key ?? null
}

export function canOpen(value: unknown): boolean {
  const header = readHeader(value)
  return header !== null && keyFor(header) !== null
}

/** Thrown when this account started over on another device (ADR e2e-3): these keys open nothing now. */
export class KeysReplacedError extends Error {
  constructor() {
    super("KEYS_REPLACED")
  }
}

/** Opens every grant addressed to this account; called on each sync so a new grant is picked up. */
export async function refreshGrants(): Promise<void> {
  if (!keyring) return
  const mine = await unwrap(api().GET("/api/v1/keys/me"))
  if (mine.account?.publicKey && mine.account.publicKey !== keyring.account.publicKey) throw new KeysReplacedError()
  let changed = false
  for (const grant of (mine.grants ?? []) as Grant[]) {
    const kind = grant.keyKind as KeyKind
    const key = await openGrant(grant.wrappedKey, keyring.account.privateKey, kind, grant.keyVersion)
    if (!key) continue
    const index = keyring.shared.findIndex((entry) => entry.kind === kind && entry.version === grant.keyVersion)
    if (index >= 0 && (await sameKey(keyring.shared[index].key, key))) continue
    // The server's grant wins over a local copy: two owner devices bootstrapping at once keep the first.
    if (index >= 0) keyring.shared.splice(index, 1)
    keyring.shared.push({ kind, version: grant.keyVersion, key })
    changed = true
  }
  if (changed) await persist()
}

async function sameKey(a: CryptoKey, b: CryptoKey): Promise<boolean> {
  const [x, y] = await Promise.all([crypto.subtle.exportKey("raw", a), crypto.subtle.exportKey("raw", b)])
  return toBase64Url(x) === toBase64Url(y)
}

interface Grant {
  keyKind: KeyKind
  keyVersion: number
  wrappedKey: string
}

interface KeyMember {
  userId: string
  mayHoldHouseholdKey: boolean
  mayHoldReportKey: boolean
  publicKey: string | null
  holds: { keyKind: KeyKind; keyVersion: number }[]
}

const fetchMembers = async () => (await unwrap(api().GET("/api/v1/keys/household/members"))) as KeyMember[]

function mayHold(member: KeyMember, kind: KeyKind): boolean {
  return kind === "HOUSEHOLD" ? member.mayHoldHouseholdKey : member.mayHoldReportKey
}

/** The server accepts at most this many grants in one request (KeyController.MAX_GRANTS). */
const GRANTS_PER_REQUEST = 50

/**
 * The owner's device creates the household's keys once; afterwards any device holding a key
 * hands each version it holds to members who may hold it and lack that version, so a new member
 * is let in, and can read records from before a rotation (ADR e2e-4), without anyone acting.
 */
export async function shareKeysWithMembers(isOwner: boolean): Promise<void> {
  if (!keyring) return
  const members = await fetchMembers()
  const grants: { userId: string; keyKind: KeyKind; keyVersion: number; wrappedKey: string }[] = []
  for (const kind of ["HOUSEHOLD", "REPORT"] as const) {
    const anyoneHolds = members.some((member) => member.holds.some((held) => held.keyKind === kind))
    if (!latest(kind) && isOwner && !anyoneHolds) {
      keyring.shared.push({ kind, version: FIRST_VERSION, key: await newSharedKey() })
      await persist()
    }
    for (const entry of keyring.shared.filter((held) => held.kind === kind)) {
      for (const member of members) {
        if (!member.publicKey || !mayHold(member, kind)) continue
        if (member.holds.some((held) => held.keyKind === kind && held.keyVersion === entry.version)) continue
        grants.push({ userId: member.userId, keyKind: kind, keyVersion: entry.version, wrappedKey: await wrapForMember(entry.key, member.publicKey, kind, entry.version) })
      }
    }
  }
  for (let from = 0; from < grants.length; from += GRANTS_PER_REQUEST) {
    await unwrap(api().POST("/api/v1/keys/household/grants", { body: grants.slice(from, from + GRANTS_PER_REQUEST) }))
  }
}

interface KeyState {
  keyKind: KeyKind
  currentVersion: number
  rotationDue: boolean
}

/** The server's answers that mean another device rotated first, or the members changed meanwhile; the next sync tries again. */
const ROTATION_LOST = new Set(["KEY_ROTATION_CONFLICT", "KEY_ROTATION_REFUSED"])

/**
 * ADR e2e-4: once someone holding a shared key has lost access, a device that holds its current
 * version makes the next one and wraps it for every remaining member, itself included. The key
 * is kept only after the server accepts it, so a lost race leaves nothing behind.
 */
export async function rotateKeysIfDue(): Promise<KeyKind[]> {
  if (!keyring) return []
  const states = (await unwrap(api().GET("/api/v1/keys/household/state"))) as KeyState[]
  const rotated: KeyKind[] = []
  for (const state of states) {
    if (!state.rotationDue || latest(state.keyKind)?.version !== state.currentVersion) continue
    const members = await fetchMembers()
    const version = state.currentVersion + 1
    const key = await newSharedKey()
    const grants = await Promise.all(members
      .filter((member) => member.publicKey && mayHold(member, state.keyKind))
      .map(async (member) => ({ userId: member.userId, wrappedKey: await wrapForMember(key, member.publicKey!, state.keyKind, version) })))
    try {
      await unwrap(api().POST("/api/v1/keys/household/rotate", { body: { keyKind: state.keyKind, keyVersion: version, grants } }))
    } catch (error) {
      if (error instanceof ApiError && ROTATION_LOST.has(error.code)) continue
      throw error
    }
    keyring.shared.push({ kind: state.keyKind, version, key })
    await persist()
    rotated.push(state.keyKind)
  }
  return rotated
}

export function openAccount(): OpenAccount | null {
  return keyring?.account ?? null
}
