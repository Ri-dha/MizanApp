import { openDatabaseAsync } from "expo-sqlite"

import { installSecretStore } from "@mizan/core/platform/secretStore"
import { installStore, TABLE_NAMES } from "@mizan/core/store/store"
import { initialiseVault } from "@mizan/core/vault/account"
import { loadSession } from "@mizan/core/auth/session"
import { initialiseLock, installBiometrics } from "@mizan/core/lock/store"
import { installApiClient } from "./api-client"
import { biometricUnlock } from "./biometric-unlock"
import { startLockWatcher } from "./lock-watcher"
import { installAuthHost, installCompressionHost, startSync } from "./hosts"
import { secureSecretStore, deviceSecret } from "./secure-secret-store"
import { createTables, sqliteStore } from "./sqlite-store"

const DATABASE = "mizan.db"
const DATABASE_SECRET = "mizan.databaseKey"


const hex = (bytes: Uint8Array) => Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")

/**
 * Opens the local database encrypted at rest (SQLCipher, keyed from the Keychain or Keystore)
 * and installs core's platform pieces. Refuses to run on a build without SQLCipher rather than
 * keep records in a plain file.
 */
export async function installPlatform(): Promise<{ cipherVersion: string }> {
  const db = await openDatabaseAsync(DATABASE)
  const cipher = await db.getFirstAsync<{ cipher_version: string }>("PRAGMA cipher_version")
  if (!cipher) throw new Error("SQLCIPHER_MISSING")
  await db.execAsync(`PRAGMA key = "x'${hex(await deviceSecret(DATABASE_SECRET))}'"`)
  await db.execAsync("PRAGMA journal_mode = WAL")
  await createTables(db, TABLE_NAMES)
  installStore(sqliteStore(db))
  installSecretStore(secureSecretStore)
  installApiClient()
  installAuthHost()
  installCompressionHost()
  await loadSession()
  await initialiseVault()
  installBiometrics(biometricUnlock)
  await initialiseLock()
  startLockWatcher()
  startSync()
  return { cipherVersion: cipher.cipher_version }
}
