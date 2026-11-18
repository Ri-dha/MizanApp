import type { webcrypto } from "node:crypto"

/** The WebCrypto key types every runtime core targets provides; Node's typings expose them only under webcrypto. */
declare global {
  type CryptoKey = webcrypto.CryptoKey
  type CryptoKeyPair = webcrypto.CryptoKeyPair
  type JsonWebKey = webcrypto.JsonWebKey
}
