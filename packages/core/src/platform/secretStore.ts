/** Bytes sealed so that only this device can open them, in the shape the web has always stored. */
export interface SealedBox {
  iv: Uint8Array<ArrayBuffer>
  sealed: ArrayBuffer
}

/**
 * The device's own secret: a non-extractable WebCrypto key in IndexedDB on the web, a key in the
 * Keychain or Keystore on phones. A copy of the local database alone must not open what it seals.
 */
export interface SecretStore {
  seal(plain: Uint8Array<ArrayBuffer>): Promise<SealedBox>
  open(box: SealedBox): Promise<Uint8Array<ArrayBuffer>>
  /** Meta entries the store keeps for itself, which a change of household must not drop. */
  readonly metaKeys: readonly string[]
}

let current: SecretStore | null = null

export function installSecretStore(next: SecretStore) {
  current = next
}

export function secretStore(): SecretStore {
  if (!current) throw new Error("SECRET_STORE_NOT_SET")
  return current
}

const IV_BYTES = 12

/** A SecretStore over one AES-GCM key, for tests and for adapters that keep the key elsewhere. */
export function aesSecretStore(key: () => Promise<CryptoKey>, metaKeys: readonly string[] = []): SecretStore {
  return {
    metaKeys,
    async seal(plain) {
      const iv = crypto.getRandomValues(new Uint8Array(new ArrayBuffer(IV_BYTES)))
      return { iv, sealed: await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await key(), plain) }
    },
    async open(box) {
      return new Uint8Array(await crypto.subtle.decrypt({ name: "AES-GCM", iv: box.iv }, await key(), box.sealed))
    },
  }
}
