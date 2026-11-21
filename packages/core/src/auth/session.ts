import { api, ApiError, unwrap } from "../api/client"
import { META_KEYS, deleteMeta, readMeta, writeMeta } from "../db/meta"
import type { LocalSession } from "../session"
import { ALL_TABLES, store, table, TABLE_NAMES } from "../store/store"
import { forgetVault, newAccountKeys, openAccountAfterSignIn, type VaultState } from "../vault/account"
import { derivePasswordKeys } from "../vault/crypto"
import { clearKeyring, deviceMetaKeys, dropSharedKeys } from "../vault/keyring"

export type { LocalSession } from "../session"

export interface Tokens {
  accessToken: string
  /** Phones keep it to refresh with; the web leaves it to the httpOnly cookie. */
  refreshToken?: string | null
}

/** What each app does with tokens and with its lock; the rest of signing in is the same everywhere. */
export interface AuthHost {
  acceptTokens(tokens: Tokens): Promise<void>
  forgetTokens(): Promise<void>
  /** A fresh access token now, because the household it names has just changed. */
  refreshTokens(): Promise<boolean>
  /** A cleared device also forgets its PIN (and on the web, its passkey). */
  resetLock(): Promise<void>
  /** Meta entries the lock keeps, which a change of household must not drop. */
  lockMetaKeys(): string[]
}

let host: AuthHost | null = null

export function installAuth(next: AuthHost) {
  host = next
}

export function authHost(): AuthHost {
  return auth()
}

function auth(): AuthHost {
  if (!host) throw new Error("AUTH_NOT_SET")
  return host
}

type Listener = () => void

const UNAUTHORIZED = 401

let session: LocalSession | null | undefined
const listeners = new Set<Listener>()

function emit() {
  listeners.forEach((listener) => listener())
}

async function persist(next: LocalSession | null) {
  session = next
  if (next) await writeMeta(META_KEYS.session, next)
  else await deleteMeta(META_KEYS.session)
  emit()
}

/** Loads the remembered session so the app opens offline; the token itself is fetched lazily. */
export async function loadSession(): Promise<LocalSession | null> {
  if (session === undefined) {
    session = (await readMeta<LocalSession>(META_KEYS.session)) ?? null
    emit()
  }
  return session
}

/** Each app turns these into its own reactive hook; returns the unsubscribe. */
export function subscribeSession(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export const currentSession = (): LocalSession | null | undefined => session

/** The app's client calls this when the server refused the refresh token. */
export function sessionLost() {
  void persist(null)
}

/** A null token keeps the one already obtained through a refresh. */
export async function rememberFromServer(tokens: Tokens | null) {
  if (tokens) await auth().acceptTokens(tokens)
  const me = await unwrap(api().GET("/api/v1/me"))
  await persist({
    userId: me.id,
    householdId: me.household.id,
    householdName: me.household.name,
    displayName: me.displayName,
    contact: me.email ?? me.phone ?? "",
    locale: me.locale,
    verified: me.verified,
    role: me.household.role,
    baseCurrency: me.household.baseCurrency,
    baseGeneration: me.household.baseGeneration,
    rebasedGeneration: me.household.rebasedGeneration,
    country: me.country,
    trackedCurrencies: me.trackedCurrencies,
    monthStartDay: me.household.monthStartDay,
    deletionRequestedAt: me.deletionRequestedAt ?? null,
    householdDeletionRequestedAt: me.household.deletionRequestedAt ?? null,
    operator: me.operator ?? false,
  })
}

/** ADR e2e-1: the password never leaves the device; the server gets an auth key derived from it. */
export async function register(identifier: string, password: string, displayName: string, locale: string, country?: string, baseCurrency?: string) {
  const { authKey, wrapSecret } = await derivePasswordKeys(identifier, password)
  const keys = await newAccountKeys(wrapSecret)
  const tokens = await unwrap(api().POST("/api/v1/auth/register", { body: { identifier, authKey, displayName, locale, country, baseCurrency, keys: keys.material } }))
  await clearLocalData()
  await rememberFromServer(tokens)
  await keys.finish()
}

/**
 * An account from before ADR e2e-1 still has a hash of the password itself, so a refused
 * sign-in is retried once with it; the server then replaces that hash with the auth key's.
 */
export async function login(identifier: string, password: string): Promise<VaultState> {
  const { authKey, wrapSecret } = await derivePasswordKeys(identifier, password)
  const tokens = await unwrap(api().POST("/api/v1/auth/login", { body: { identifier, authKey } })).catch(async (error: unknown) => {
    if (!(error instanceof ApiError) || error.status !== UNAUTHORIZED) throw error
    return unwrap(api().POST("/api/v1/auth/login", { body: { identifier, authKey, legacyPassword: password } }))
  })
  await clearLocalData()
  await rememberFromServer(tokens)
  return openAccountAfterSignIn(wrapSecret)
}

/**
 * A session from before ADR e2e-1 has no keys on this device. Signing in again proves the
 * password and derives them, without clearing rows that may still be waiting to sync.
 */
export async function unlockVault(password: string): Promise<VaultState> {
  const identifier = session?.contact ?? ""
  const { authKey, wrapSecret } = await derivePasswordKeys(identifier, password)
  const tokens = await unwrap(api().POST("/api/v1/auth/login", { body: { identifier, authKey } })).catch(async (error: unknown) => {
    if (!(error instanceof ApiError) || error.status !== UNAUTHORIZED) throw error
    return unwrap(api().POST("/api/v1/auth/login", { body: { identifier, authKey, legacyPassword: password } }))
  })
  await auth().acceptTokens(tokens)
  return openAccountAfterSignIn(wrapSecret)
}

/** Called on every sync, so a role granted or changed elsewhere shows without signing in again. */
export async function refreshProfile() {
  const me = await unwrap(api().GET("/api/v1/me"))
  if (!session) return
  const next = { ...session, verified: me.verified, householdName: me.household.name, monthStartDay: me.household.monthStartDay, role: me.household.role, deletionRequestedAt: me.deletionRequestedAt ?? null, householdDeletionRequestedAt: me.household.deletionRequestedAt ?? null, operator: me.operator ?? false }
  if (JSON.stringify(next) !== JSON.stringify(session)) await persist(next)
}

/** FR-ACC-08: the account and household are purged after the grace period unless withdrawn. */
export async function requestAccountDeletion() {
  const me = await unwrap(api().POST("/api/v1/me/deletion-request"))
  if (session) await persist({ ...session, deletionRequestedAt: me.deletionRequestedAt ?? null })
}

export async function cancelAccountDeletion() {
  const me = await unwrap(api().DELETE("/api/v1/me/deletion-request"))
  if (session) await persist({ ...session, deletionRequestedAt: me.deletionRequestedAt ?? null })
}

export async function verifyContact(code: string) {
  await unwrap(api().POST("/api/v1/auth/verify", { body: { code } }))
  await refreshProfile()
}

export async function resendVerification() {
  await unwrap(api().POST("/api/v1/auth/verify/resend"))
}

export async function requestPasswordReset(identifier: string) {
  await unwrap(api().POST("/api/v1/auth/password-reset/request", { body: { identifier } }))
}

export async function confirmPasswordReset(identifier: string, code: string, newPassword: string) {
  const { authKey } = await derivePasswordKeys(identifier, newPassword)
  await unwrap(api().POST("/api/v1/auth/password-reset/confirm", { body: { identifier, code, newAuthKey: authKey } }))
}

export async function authKeyFor(password: string): Promise<string> {
  return (await derivePasswordKeys(session?.contact ?? "", password)).authKey
}

export async function updateHousehold(changes: { name?: string; monthStartDay?: number }) {
  const household = await unwrap(api().PATCH("/api/v1/households/current", { body: changes }))
  if (!session) return
  await persist({ ...session, householdName: household.name, monthStartDay: household.monthStartDay })
}

export async function logout() {
  try {
    await api().POST("/api/v1/auth/logout")
  } catch {
    // Offline sign-out still clears the device; the refresh token expires on its own.
  }
  await auth().forgetTokens()
  await clearLocalData()
  await persist(null)
}

const deviceMeta = (): string[] => [...auth().lockMetaKeys(), ...deviceMetaKeys()]

/**
 * A change of household keeps what belongs to the person and the device (the PIN, the
 * account's own keys) and drops every row and shared key of the household being left.
 */
export async function clearHouseholdData() {
  const kept = (await table("meta").bulkGet(deviceMeta())).filter((entry) => entry !== undefined)
  await store().transaction(ALL_TABLES, async () => {
    for (const name of TABLE_NAMES) await table(name).clear()
    await table("meta").bulkPut(kept)
  })
  await dropSharedKeys()
}

/** A different account must never see the previous one's rows; the whole local store goes. */
export async function clearLocalData() {
  await clearKeyring()
  await store().transaction(ALL_TABLES, async () => {
    for (const name of TABLE_NAMES) await table(name).clear()
  })
  forgetVault()
  await auth().resetLock()
}
