import * as SecureStore from "expo-secure-store"

import { aesSecretStore, type SecretStore } from "@mizan/core/platform/secretStore"

const KEY_BYTES = 32
const ACCESS = { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY }

/** A random key held by the Keychain or Keystore; created on first use and never leaves the device. */
export async function deviceSecret(name: string): Promise<Uint8Array<ArrayBuffer>> {
  const stored = await SecureStore.getItemAsync(name, ACCESS)
  if (stored) return Uint8Array.from(atob(stored), (c) => c.charCodeAt(0)) as Uint8Array<ArrayBuffer>
  const fresh = crypto.getRandomValues(new Uint8Array(new ArrayBuffer(KEY_BYTES)))
  await SecureStore.setItemAsync(name, btoa(String.fromCharCode(...fresh)), ACCESS)
  return fresh
}

const KEYRING_SECRET = "mizan.keyringKey"

let keyringKey: Promise<CryptoKey> | null = null

export const secureSecretStore: SecretStore = aesSecretStore(() => {
  keyringKey ??= deviceSecret(KEYRING_SECRET).then((raw) => crypto.subtle.importKey("raw", raw, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]))
  return keyringKey
})
