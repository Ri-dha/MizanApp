# Status — mobile-app
- Repo: Ri-dha/MizanApp (ADR split-1). Phase 1 committed on `feat/mobile-crypto-spike`. Phase 2 on
  `feat/mobile-core` (from `chore/split-clients`), uncommitted.
- Exists: Phase 1 spike in `spikes/rn-crypto` (throwaway Expo SDK 58 app plus a Node verifier,
  `harness/`). It runs the unchanged `web/src/vault/crypto.ts` on the phone.
- Result: `react-native-quick-crypto` matches the web byte for byte, 18 of 18 cases on the iPhone 17
  simulator and an Android API 37 emulator, both directions (phone opens web data, web opens phone
  data). No `@noble/*` fallback needed. Details: `docs/learnings/2026-11-18-quick-crypto-matches-web-vault.md`.
- Open: PBKDF2 600k timing on a real mid-range phone (emulators use the Mac's CPU).
- **OCR is on hold until the end of T-mobile-app, to be decided then** (owner, 2026-11-18). Not
  built until then: live camera recognition, Apple Vision on iPhone, native document scanners,
  Arabic on Android (Tesseract). The receipt photo flow ships in parity without reading text.
  Already in place for when it resumes: the parsing step (`extractReceipt`) moves to
  `packages/core` in Phase 2; all OCR must run on the device (ADR e2e-1).
- Order: T-shadcn-ui, T-price-history and T-admin-dashboard finished first (main at d5099dc), so
  parity includes the Prices screen and the dashboard. Scope: full parity, iPhone and Android together.
- Phase 2 step 1 done: `packages/core` (source package, ADR mobile-2) holds domain maths, record
  types, hlc, merge, vault crypto, receipt parsing, translations, API types. Core 126 + web 45
  tests (171, unchanged); web build and the prod web image pass.
- Phase 2 step 2 done: the `Store` interface with a Dexie adapter (web) and an in-memory one
  (tests); all `db/` modules, the month view and price resolution are in core. Core 140 + web 39
  tests; checked live in the browser (sign-in, sync, sealed rows, live ledger updates).
- Phase 2 steps 3–4 done: API client slot, `SecretStore`, keyring, records, the sync engine and
  device duties in core (ADR mobile-3); old keyrings still open. Core 143 + web 39 tests; checked
  live. On main.
- Phase 2 complete (2026-11-18): also vault account state, PIN lock key, file encryption, backup
  format, export and import, metals and net worth views. Core 146 + web 39 tests; checked live.
- Phase 3 complete and on main (3a41f92).
- Phase 4 step 1 (uncommitted, `feat/mobile-foundation`): the Expo app in `mobile/` with SQLCipher
  storage, Keychain/Keystore secrets and lifecycle adapters; all 30 vault vectors pass on the iPhone
  simulator and the Android emulator.
- Phase 4 step 2 (uncommitted, `feat/mobile-app-shell`): sign-in and sync on the phone; web,
  iPhone and Android open each other's sealed records (checked live).
- Phase 4 step 3 (uncommitted, `feat/mobile-ui`): native look in Mizan's colours (ADR mobile-5),
  light, dark and Arabic RTL checked on the iPhone simulator.
- Phase 4 step 4 (uncommitted, `feat/mobile-lock`): PIN, Face ID or fingerprint, re-lock after
  the grace period, privacy cover; lock logic shared with the web in core. Phase 4 complete.
- Phase 5 step 1 (uncommitted, `feat/mobile-auth-screens`): register, reset, verify, recovery and
  start over on the phone; checked live on the iPhone.
- Phase 5 steps 1–2 and the start of step 3 are on main (cd53e6a). The ledger is on main
  (d8add28), the plan and move money (df0605e), goals (4b12dcd), debts, bills and income
  (7a3e1fd); step 3 is complete. Step 4 on `feat/mobile-wealth` (uncommitted): cash accounts
  and gold and silver (lots, sell with undo, price table, refresh, override, zakat, market
  settings, explainer), checked on the iPhone.
- Next: other assets, net worth with month close, reports; dealer products. Sell-or-hold has a
  chart and waits for step 7. A full reload locks the app (the data key is in memory); fast
  refresh does not. Blockers: none.
