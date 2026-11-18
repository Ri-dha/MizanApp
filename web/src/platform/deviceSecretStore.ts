import { readMeta, writeMeta } from "@mizan/core/db/meta"
import { aesSecretStore, type SecretStore } from "@mizan/core/platform/secretStore"

const DEVICE_KEY = "vault.deviceKey"

/**
 * A non-extractable key that IndexedDB keeps as an opaque handle, so a copy of the database
 * files alone does not open what it seals.
 */
async function deviceKey(): Promise<CryptoKey> {
  const known = await readMeta<CryptoKey>(DEVICE_KEY)
  if (known) return known
  const key = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"])
  await writeMeta(DEVICE_KEY, key)
  return key
}

export const deviceSecretStore: SecretStore = aesSecretStore(deviceKey, [DEVICE_KEY])
