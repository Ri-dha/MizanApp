import * as SecureStore from "expo-secure-store"

import { META_KEYS, deleteMeta, readMeta, writeMeta } from "@mizan/core/db/meta"
import { unwrapDataKey, wrapDataKey, type WrappedKey } from "@mizan/core/lock/crypto"
import type { BiometricUnlock } from "@mizan/core/lock/store"
import i18n from "@/i18n"

const SECRET = "mizan.biometricSecret"
const SECRET_BYTES = 32
const guarded = () => ({
  requireAuthentication: true,
  keychainAccessible: SecureStore.WHEN_PASSCODE_SET_THIS_DEVICE_ONLY,
  authenticationPrompt: i18n.t("lock.biometric"),
})

const toBase64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes))
const fromBase64 = (text: string) => Uint8Array.from(atob(text), (c) => c.charCodeAt(0))

/**
 * A random secret only Face ID or a fingerprint can release from the Keychain or Keystore; it
 * wraps the data key the same way the PIN does. Changing the enrolled biometrics invalidates the
 * secret, and the PIN still opens the lock.
 */
export const biometricUnlock: BiometricUnlock = {
  available: async () => SecureStore.canUseBiometricAuthentication(),
  enrolled: async () => (await readMeta<WrappedKey>(META_KEYS.biometric)) !== undefined,
  async enrol(dataKey) {
    if (!SecureStore.canUseBiometricAuthentication()) return false
    const secret = crypto.getRandomValues(new Uint8Array(SECRET_BYTES))
    try {
      await SecureStore.setItemAsync(SECRET, toBase64(secret), guarded())
    } catch {
      return false
    }
    await writeMeta(META_KEYS.biometric, await wrapDataKey(dataKey, secret))
    return true
  },
  async unlock() {
    const entry = await readMeta<WrappedKey>(META_KEYS.biometric)
    if (!entry) return null
    try {
      const secret = await SecureStore.getItemAsync(SECRET, guarded())
      return secret ? unwrapDataKey(entry, fromBase64(secret)) : null
    } catch {
      return null
    }
  },
  async remove() {
    await deleteMeta(META_KEYS.biometric)
    await SecureStore.deleteItemAsync(SECRET, { keychainAccessible: SecureStore.WHEN_PASSCODE_SET_THIS_DEVICE_ONLY })
  },
}
