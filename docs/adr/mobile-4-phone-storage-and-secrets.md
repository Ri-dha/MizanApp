# ADR mobile-4 — Phone storage: SQLCipher, keys in the Keychain or Keystore

- Date: 2026-11-18
- Status: accepted
- Task: T-mobile-app (Phase 4)

## Context
Core reaches local storage, the device secret and app lifecycle through interfaces (ADR mobile-2,
mobile-3). The web implements them with Dexie, a non-extractable WebCrypto key in IndexedDB and
browser events. Phones have no IndexedDB and cannot keep a non-extractable WebCrypto key, but
they do have an encrypted SQLite (SQLCipher, built into `expo-sqlite`) and a hardware-backed
secret store.

## Decision
- `Store` on phones is `mobile/src/platform/sqlite-store.ts` over `expo-sqlite` built with
  SQLCipher (`useSQLCipher` in `app.json`). One SQL table per local table (`TABLE_NAMES` in core):
  `key` primary key, `data` JSON. Lookups by field use `json_extract`; sorting happens in core as
  on the web. Bytes inside rows are tagged in the JSON (`json-bytes.ts`).
- The database key is 256 random bits in `expo-secure-store` (`WHEN_UNLOCKED_THIS_DEVICE_ONLY`),
  applied with `PRAGMA key` right after opening. The app refuses to start when
  `PRAGMA cipher_version` returns nothing, rather than write records to a plain file.
- `SecretStore` on phones is a second 256-bit key in the same store, used through core's
  `aesSecretStore`; it seals the keyring exactly as the web's device key does.
- `Lifecycle` is `AppState` (foreground) and NetInfo (online and offline).
- Transactions: the outermost `Store.transaction` uses `withTransactionAsync`; nested ones run
  inside it. React Native has no async context, so a query started elsewhere while a transaction
  is open joins it. `withExclusiveTransactionAsync` would not fix that for our table API, so the
  rule from ADR mobile-2 stands: nothing but store work inside a transaction.
- Screens learn about writes from `onStoreChange` in the adapter; it stands in for Dexie's live
  queries.

## Consequences
- The local file on a phone is encrypted at rest, which the web still lacks (T-local-encryption).
- Restoring a phone from backup does not carry the keys (this-device-only), so a restored phone
  signs in again and pulls; nothing is lost because the server holds every sealed record.
- Encrypted SQLite does not run in Expo Go; development uses a development build.
