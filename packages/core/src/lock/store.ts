import { META_KEYS, deleteMeta, readMeta, writeMeta } from "../db/meta"
import { generateDataKey, secretFromPin, unwrapDataKey, wrapDataKey, type WrappedKey } from "./crypto"

export const DEFAULT_LOCK_AFTER_SECONDS = 30
const MS_PER_SECOND = 1000

export type LockState = "unknown" | "no-pin" | "locked" | "unlocked"

/** The second way in: WebAuthn PRF on the web, Face ID or a fingerprint guarding a Keychain/Keystore secret on phones. */
export interface BiometricUnlock {
  available(): Promise<boolean>
  enrolled(): Promise<boolean>
  enrol(dataKey: CryptoKey): Promise<boolean>
  unlock(): Promise<CryptoKey | null>
  remove(): Promise<void>
}

const NO_BIOMETRICS: BiometricUnlock = {
  available: async () => false,
  enrolled: async () => false,
  enrol: async () => false,
  unlock: async () => null,
  remove: async () => {},
}

let biometrics: BiometricUnlock = NO_BIOMETRICS
let state: LockState = "unknown"
let dataKey: CryptoKey | null = null
let hiddenAt: number | null = null
const listeners = new Set<() => void>()

export function installBiometrics(next: BiometricUnlock) {
  biometrics = next
}

export const biometricUnlock = (): BiometricUnlock => biometrics

function set(next: LockState) {
  state = next
  listeners.forEach((listener) => listener())
}

/** Each app turns these into its own reactive hook; returns the unsubscribe. */
export function subscribeLock(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export const lockState = (): LockState => state

export function currentDataKey(): CryptoKey | null {
  return dataKey
}

export async function initialiseLock() {
  const pin = await readMeta<WrappedKey>(META_KEYS.pin)
  set(pin ? "locked" : "no-pin")
}

/** The meta store was wiped under a running app (another account signed in), so the PIN is re-read. */
export async function resetLock() {
  dataKey = null
  await initialiseLock()
}

export async function setPin(pin: string): Promise<CryptoKey> {
  const key = dataKey ?? (await generateDataKey())
  await writeMeta(META_KEYS.pin, await wrapDataKey(key, secretFromPin(pin)))
  dataKey = key
  set("unlocked")
  return key
}

export async function unlockWithPin(pin: string): Promise<boolean> {
  const entry = await readMeta<WrappedKey>(META_KEYS.pin)
  if (!entry) return false
  const key = await unwrapDataKey(entry, secretFromPin(pin))
  if (!key) return false
  dataKey = key
  set("unlocked")
  return true
}

export async function unlockWithBiometrics(): Promise<boolean> {
  const key = await biometrics.unlock()
  if (!key) return false
  dataKey = key
  set("unlocked")
  return true
}

export async function removePin() {
  await deleteMeta(META_KEYS.pin)
  await biometrics.remove()
  dataKey = null
  set("no-pin")
}

export function lock() {
  if (state === "unlocked") {
    dataKey = null
    set("locked")
  }
}

export async function clearLock() {
  dataKey = null
  await deleteMeta(META_KEYS.pin)
  await biometrics.remove()
  set("unknown")
}

/** The app went to the background or the task switcher. */
export function appHidden(now = Date.now()) {
  hiddenAt = now
}

/** FR-ACC-03: back on screen after longer than the configured grace re-locks it. */
export async function appShown(now = Date.now()) {
  if (hiddenAt === null) return
  const after = (await readMeta<number>(META_KEYS.lockAfterSeconds)) ?? DEFAULT_LOCK_AFTER_SECONDS
  if (now - hiddenAt >= after * MS_PER_SECOND) lock()
  hiddenAt = null
}
