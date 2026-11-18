# T-mobile-app — iPhone and Android apps with Expo
- Status: in-progress (2026-11-18), Phase 1 done; Phases 1–3 done and on main; Phase 4 in progress on feat/mobile-foundation
- Context: ADR mobile-1 (accepted), ADR e2e-1, e2e-2, sync-1, ui-1. Supersedes T-flutter-app.
  Owner decisions 2026-11-18: after T-shadcn-ui and before T-price-history and T-admin-dashboard;
  full parity in the first release; iPhone and Android together; **OCR on hold until the end**
  (see `docs/status/mobile-app.md`).
- Notes (phases; effort about 9–12 weeks before OCR):
  0. Done 2026-11-18: the web work is on main and develop (d5099dc); Xcode, Android Studio and CocoaPods installed
     (Apple Developer $99/year for real iPhones, Google Play $25 at release).
  1. Spike (1–2 days): prove `react-native-quick-crypto` `subtle` matches the web byte for byte
     for PBKDF2-SHA256 600k (timed on a mid-range Android), HKDF, AES-GCM with AAD, AES-KW, ECDH
     P-256, import/export raw, spki, pkcs8, jwk, SHA-256. Gaps: `@noble/*`, but PBKDF2 stays
     native. Write a learning with the result.
     Done 2026-11-18: 18 of 18 cases pass on iOS and Android with the unchanged vault module, no
     fallback needed (`docs/learnings/2026-11-18-quick-crypto-matches-web-vault.md`,
     `spikes/rn-crypto`). Still open: PBKDF2 timing on a real mid-range phone.
  2. Shared core: `packages/core` as a source package, no workspaces (ADR mobile-2) (no React, no browser or RN globals). Move
     `domain/`, receipt parsing, `sync/hlc.ts`, `sync/merge.ts`, `vault/crypto.ts`,
     `vault/records.ts`, schema types, translations, API types. Platform interfaces: `Store`
     (tables, transactions, change events, meta, outbox, conflicts, sealed inbox; web adapter
     wraps Dexie), `Crypto` (SubtleCrypto), `SecretStore`, `Lifecycle`. Then move `db/*.ts`,
     `db/write.ts`, `db/householdFigure.ts`, `sync/engine.ts`, `sync/duties.ts`,
     `vault/keyring.ts`, `vault/account.ts`, `market/store.ts` logic, `lock/crypto.ts`,
     `attachments/crypto.ts`, the backup format, and the logic of `useMonthFigures`,
     `useMetals`, `useNetWorth`. Web tests green after every step. ADR mobile-2 for the
     interfaces.
     Step 1 done 2026-11-18 (feat/mobile-core): core package with its own tests and CI job;
     moved `domain/`, record types and `SYNC_TABLES`, `sync/hlc.ts`, `sync/merge.ts`,
     `vault/crypto.ts`, receipt parsing, translations, API types. `formatMoney` takes the digit
     style as a parameter (`web/src/app/money.ts` passes the preference). Core 126 tests, web 45
     (171 as before). `vault/records.ts` waits for the keyring (stateful).
     Step 2 done 2026-11-18: `Store` interface in core (`store/store.ts`: typed tables, `where`,
     nested transactions, `rows`/`rowsBy`/`sorted`), an in-memory store for core tests, and the
     Dexie adapter (`web/src/platform/dexieStore.ts`, installed with the database). All 14 `db/`
     modules, the month view logic and price resolution (`market/prices.ts`) moved to core; web
     keeps the Dexie class, the hooks and the two price fetches. Core 140, web 39 tests; live
     updates checked in the browser (learning 2026-11-18-dexie-live-queries-need-dexie-promises).
     Step 3 done 2026-11-18: the API client slot (`api/client.ts`: `installApi`, `ApiError`,
     `unwrap`; core imports only openapi-fetch's types), `SecretStore` (`platform/secretStore.ts`;
     the web's `deviceSecretStore` keeps `vault.deviceKey` and the stored keyring format, so
     existing devices open without a password, checked live), keyring and records in core.
     `web/src/platform/install.ts` installs the store, secret store and API client. Core 142,
     web 39 tests.
     Step 4 done 2026-11-18 (ADR mobile-3): sync engine and device duties in core with a
     `SyncHost` and `Lifecycle` (web: `browserLifecycle`, host in `web/src/sync/engine.ts`);
     roles in core; `onLocalWrite` replaces the Dexie outbox hook; `required()` for fields the
     server always sends. Core integration test of a first sync against a fake server. Core 143,
     web 39 tests; checked live (sync, push after a write, live ledger).
     Step 5 done 2026-11-18: vault account state (`vault/account.ts`, hooks stay in web), PIN lock
     key (`lock/crypto.ts`), per-file encryption (`attachments/crypto.ts`; the legacy device-key
     path stays in web), the backup format (`backup/format.ts`, gzip passed in so core keeps no
     dependency; same `MZB1` bytes), export and import (`data/export.ts`), and the metals and net
     worth view logic (`db/metalsView.ts`, `db/netWorthView.ts`). Core 146, web 39 tests; checked
     live. Phase 2 is complete: what stays in web is React hooks, the Dexie class, the browser
     adapters, WebAuthn, Tesseract, blob upload and download, and the lock and backup state that
     each app drives its own way.
  3. Vectors: `shared/test-vectors/vault-*.json` (identifier normalisation, auth key and wrap
     secret, account key wrap/open, grant wrap/open, field seal/open, deterministic ids, blob
     keys), generated from the web with fixed randomness; core and mobile run them.
     Done 2026-11-18: nine `shared/test-vectors/vault-*.json` files (identifiers, password keys,
     recovery codes, key wrapping, account, grants, fields, deterministic ids, device files:
     receipt file, MZB1 backup, PIN lock), 30 cases, run by
     `packages/core/src/vault/vectors.test.ts`. Written once by `npm run vectors:vault` in
     `packages/core`; changing the padding or an HKDF label fails them (checked). The phone app's
     tests load the same files in Phase 4.
  4. Mobile foundation: Expo with Expo Router and development builds; adapters over `expo-sqlite`
     with SQLCipher, quick-crypto, `expo-secure-store`, AppState and NetInfo; `openapi-fetch`
     with the refresh token in secure storage; NativeWind and react-native-reusables (shadcn
     look), light/dark, Arabic RTL; PIN plus `expo-local-authentication`.
     Step 1 done 2026-11-19 (ADR mobile-4, on feat/mobile-foundation): Expo SDK 58 app in
     `mobile/` (Expo Router, `src/app`), `@mizan/core` through Metro and TypeScript paths,
     quick-crypto installed before anything else (`index.ts`), `Store` over SQLCipher
     (`src/platform/sqlite-store.ts`), `SecretStore` and the database key in the Keychain or
     Keystore, `Lifecycle` over AppState and NetInfo. A diagnostics screen runs core's
     `vaultVectorChecks`: 30 of 30 pass on the iPhone 17 simulator and the Android API 37
     emulator.
     Step 2 done 2026-11-19 (feat/mobile-app-shell): sign-in and the session moved to core
     (`auth/session.ts` with an `AuthHost` for tokens and the lock; the web host keeps the cookie,
     the phone keeps the refresh token in secure storage and sends it in the body); price fetches
     in core; API types regenerated now that the server marks fields required, so the engine's
     `required()` guards are gone. Phone: API client, auth and sync hosts, `useLiveQuery` over
     `onStoreChange`, i18next with core's translations and the device language, and plain sign-in,
     unlock, recovery-code and ledger screens. Checked live: a household made on the web opens on
     the iPhone and Android, a transaction added on the iPhone shows decrypted on the web and on
     Android. Next: NativeWind and the shadcn-style components, light and dark, RTL, PIN and
     biometrics.
  5. Parity, in the web app's order: auth and vault screens, sync, home, ledger and quick add,
     plan, income, bills, debts, goals, cash, gold and silver, assets, net worth and month close,
     reports, household and join links, advisor, settings (theme, language, privacy, backup,
     notifications, CSV via share sheet), help, tours, receipt photos (no OCR), charts.
  6. Push and release: `PushSubscription` channel and token, `ExpoPushSender` beside
     `WebPushSender`, a Flyway migration; mobile registers its token and uploads the reminder
     schedule; icons, store listings in English and Arabic, TestFlight and Play internal testing.
  7. OCR: on hold; decided at the end.
- Done means: the mobile app passes every vector, syncs both ways with the web in one household,
  opens records sealed by the web and vice versa, and matches the household figure and month
  close to the dinar, in light and dark, English and Arabic.
