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
  (7a3e1fd), cash accounts and gold and silver (fc2525c), other assets, net worth and reports
  (484c16a); step 4 is complete. Step 5 on `feat/mobile-household` (uncommitted): household
  (members, roles, invitations shared by the share sheet, join by link and `mizan://join/<token>`,
  switch, leave, delete), the advisor view, help (the bundled manual), and per-role tabs and More
  (advisor: report, household, help, sync; dependent: no plan). Household calls and manual parsing
  moved to core for both apps; `AuthHost` gained `refreshTokens`. Checked on the iPhone as owner;
  advisor and dependent views not yet seen with real accounts. Customisable Home (ADR home-1):
  cards shown, order, size and per-card options, synced as a private `home_layout` record, edited
  in Settings on both apps (the phone's Settings starts here); the server side is on MizanApi.
  Checked on the iPhone; the web editor passes its checks but was not opened in a browser.
- Household, advisor, help and the customisable Home are on main (edfecfe; server cc9de7f). On
  `feat/mobile-settings` (uncommitted): Settings on the phone (language with a restart for the
  layout direction, theme, lock timing, biometrics, lock now, remove PIN, new recovery code,
  privacy defaults, digits, Hijri dates, dollar figure, valuation reminder, the synced notification
  switches, sign out, account deletion). Phone preferences live in `expo-sqlite/kv-store`, per
  device like the web's; money and dates on the phone go through them (`@/utils/money`,
  `formatDay`). Phone push is Phase 6.
- Settings (6eff853), Your data (ca6dbda) and the tours (a5f96bc) are on main; step 5 is done.
- Step 6 is on main (4b11fef): receipts and backup, with the attachment pipeline and backup store
  in core. The receipt photo is now checked on the iPhone (library permission prompt, picker,
  encrypted attachment and preview); the photo library no longer asks for permission first.
  Uploads stay pending locally while the dev object storage is not running.
- Step 7 is on main (b6c212e): charts with react-native-svg (ADR mobile-6) and the Prices screen.
- Parity review on `feat/mobile-parity` (uncommitted): every web screen has a phone counterpart
  except the operator Admin page, which stays on the web. Added: reports saved as PDF through the
  share sheet (expo-print), operator announcements and the revaluation prompt on Home, and no
  add button for viewers and advisors. A translation parity test now checks English and Arabic
  carry the same strings; a scan of both apps found three keys used but missing
  (`assets.stalePrompt`, `transactions.note`, `settings.cancel`), now fixed, so the web's Home
  revaluation prompt shows text instead of its key. Phase 5 is complete.
- Still unverified on a device: viewer and advisor views with real accounts, JSON/CSV import,
  the camera, uploads to object storage.
- Next: Phase 6 (push notifications, then store release).
  A full reload locks the app (the data key is in memory); fast refresh does not. Reopened months
  still count as the last close in the attribution (core, same on the web). Blockers: none.
