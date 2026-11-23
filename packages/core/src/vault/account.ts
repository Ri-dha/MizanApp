import { api, unwrap } from "../api/client"
import { deleteMeta, readMeta, writeMeta } from "../db/meta"
import {
  createAccountKeys, newRecoveryCode, openAccountWithPassword, openAccountWithRecovery, wrapUserKeyForPassword, wrapUserKeyForRecovery,
  type AccountKeyMaterial,
} from "./crypto"
import { hasAccountKeys, loadKeyring, openAccount, setAccount } from "./keyring"

/** "needs-recovery": the password changed by reset, so only the recovery code can open the keys. */
export type VaultState = "unknown" | "ready" | "needs-recovery" | "missing"

const RECOVERY_TO_SHOW = "vault.recoveryToShow"
const RECOVERY_CHECKED_AT = "vault.recoveryCheckedAt"
const DAY_MS = 86_400_000
/** How long a "yes, I still have it" holds before Home asks again. */
export const RECOVERY_REMINDER_DAYS = 180

let state: VaultState = "unknown"
let pendingWrapSecret: Uint8Array<ArrayBuffer> | null = null
let recoveryToShow: string | null = null
let recoveryCheckedAt: string | null = null
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((listener) => listener())
}

const readyListeners = new Set<() => void>()

function set(next: VaultState) {
  const opened = next === "ready" && state !== "ready"
  state = next
  emit()
  if (opened) readyListeners.forEach((listener) => listener())
}

/** Sync waits for the keys; this lets it start the moment they open. */
export function onVaultReady(listener: () => void) {
  readyListeners.add(listener)
}

/** Each app turns these into its own reactive hooks; returns the unsubscribe. */
export function subscribeVault(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export const vaultState = (): VaultState => state

export const recoveryCodeToShow = (): string | null => recoveryToShow

/**
 * The code is the only way back after a forgotten password (ADR e2e-1), so Home asks on each
 * device until the person says they have it, and again after a while. A device that never saw
 * the answer asks too, because the code may have been lost since.
 */
export function recoveryReminderDue(checkedAt: string | null, now: number): boolean {
  return checkedAt === null || now - Date.parse(checkedAt) > RECOVERY_REMINDER_DAYS * DAY_MS
}

/** Only once the keys are open and no new code is waiting to be shown. */
export const recoveryReminderShown = (): boolean =>
  state === "ready" && recoveryToShow === null && recoveryReminderDue(recoveryCheckedAt, Date.now())

export async function confirmRecoveryCodeKept() {
  recoveryCheckedAt = new Date().toISOString()
  await writeMeta(RECOVERY_CHECKED_AT, recoveryCheckedAt)
  emit()
}

export function vaultReady(): boolean {
  return state === "ready"
}

export async function initialiseVault() {
  recoveryToShow = (await readMeta<string>(RECOVERY_TO_SHOW)) ?? null
  recoveryCheckedAt = (await readMeta<string>(RECOVERY_CHECKED_AT)) ?? null
  set((await loadKeyring()) ? "ready" : "missing")
}

async function showRecoveryCode(code: string) {
  recoveryToShow = code
  await writeMeta(RECOVERY_TO_SHOW, code)
  emit()
}

export async function acknowledgeRecoveryCode() {
  recoveryToShow = null
  await deleteMeta(RECOVERY_TO_SHOW)
  await confirmRecoveryCodeKept()
}

/** Keys for a brand-new account, created before registering so the server stores them with it. */
export async function newAccountKeys(wrapSecret: Uint8Array<ArrayBuffer>): Promise<{ material: AccountKeyMaterial; finish: () => Promise<void> }> {
  const created = await createAccountKeys(wrapSecret)
  return {
    material: created.material,
    finish: async () => {
      await setAccount(created.account)
      await showRecoveryCode(created.recoveryCode)
      set("ready")
    },
  }
}

/** After sign-in: open the account's keys, or create them for an account from before ADR e2e-1. */
export async function openAccountAfterSignIn(wrapSecret: Uint8Array<ArrayBuffer>): Promise<VaultState> {
  const mine = await unwrap(api().GET("/api/v1/keys/me"))
  if (!mine.account) {
    const created = await createAccountKeys(wrapSecret)
    await unwrap(api().PUT("/api/v1/keys/me", { body: created.material }))
    await setAccount(created.account)
    await showRecoveryCode(created.recoveryCode)
    set("ready")
    return state
  }
  const opened = await openAccountWithPassword(mine.account as AccountKeyMaterial, wrapSecret)
  if (!opened) {
    pendingWrapSecret = wrapSecret
    set("needs-recovery")
    return state
  }
  await setAccount(opened)
  set("ready")
  return state
}

/** Opens the keys with the recovery code and re-wraps them under the new password. */
export async function recoverWithCode(code: string): Promise<boolean> {
  const mine = await unwrap(api().GET("/api/v1/keys/me"))
  if (!mine.account || !pendingWrapSecret) return false
  const opened = await openAccountWithRecovery(mine.account as AccountKeyMaterial, code)
  if (!opened) return false
  await unwrap(api().PATCH("/api/v1/keys/me", { body: { wrappedByPassword: await wrapUserKeyForPassword(opened.userKey, pendingWrapSecret) } }))
  pendingWrapSecret = null
  await setAccount(opened)
  set("ready")
  return true
}

export type ResetPreview = Awaited<ReturnType<typeof previewStartOver>>
export const previewStartOver = () => unwrap(api().GET("/api/v1/keys/me/reset-preview"))

/**
 * ADR e2e-3: without the recovery code the old keys are gone for good. New keys replace them,
 * and the server removes what was sealed under the old ones.
 */
export async function startOver(): Promise<void> {
  if (!pendingWrapSecret) throw new Error("VAULT_NO_PASSWORD")
  const created = await createAccountKeys(pendingWrapSecret)
  await unwrap(api().POST("/api/v1/keys/me/reset", { body: { ...created.material, confirm: RESET_CONFIRMATION } }))
  pendingWrapSecret = null
  await setAccount(created.account)
  await showRecoveryCode(created.recoveryCode)
  set("ready")
}

const RESET_CONFIRMATION = "RESET"

/** A new recovery code replaces the old one, which stops working at once. */
export async function regenerateRecoveryCode(): Promise<void> {
  const account = openAccount()
  if (!account) throw new Error("VAULT_LOCKED")
  const code = newRecoveryCode()
  await unwrap(api().PATCH("/api/v1/keys/me", { body: { wrappedByRecovery: await wrapUserKeyForRecovery(account.userKey, code) } }))
  await showRecoveryCode(code)
}

export function forgetVault() {
  pendingWrapSecret = null
  recoveryToShow = null
  set(hasAccountKeys() ? "ready" : "missing")
}
