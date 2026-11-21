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
- Phase 5 is complete and on main (a08eee9). Unverified on a device: viewer and advisor views,
  JSON/CSV import, the camera, uploads to object storage.
- Phase 6 step 1 (push), uncommitted: server on MizanApi `feat/expo-push` (worktree
  `../.wt-expo-push`): channel on push subscriptions (V027), `POST/DELETE
  /api/v1/notifications/phones`, `ExpoPushSender` (ADR push-1); 115 server tests green. App on
  `feat/mobile-push`: regenerated API types, expo-notifications, a phone switch and test in
  Settings, tapped reminders open their screen. Without an EAS project the phone says it cannot
  receive notifications yet (checked on the iPhone).
- Phase 6 step 1 is on main (app bbd9a42, server 2c6a8d4).
- Phase 6 step 2 (uncommitted, `feat/mobile-release`): interim icon and splash (balance-scale
  glyph on `#2e62c9`, sources in `mobile/assets/brand/`), `mobile/eas.json` (development,
  simulator, preview, production; remote versions; Play internal track), the API and web origins
  from `EXPO_PUBLIC_API_ORIGIN` / `EXPO_PUBLIC_WEB_ORIGIN` (a release build without the API origin
  refuses to start), and `docs/store/`: listings in English and Arabic, privacy label and data
  safety answers, the owner's release checklist. `expo config` resolves; icon and splash checked on the
  iPhone simulator and the Android emulator (adaptive icon) after a rebuild.
- Step 2 is on main (5bea363). On `feat/privacy-page` (uncommitted): a public bilingual privacy
  policy at `/privacy.html` (static, outside the service worker's app fallback), linked from Help on
  the web and the phone (in-app browser); checked in a browser in Arabic and dark mode. Also fixed: the More tab lost its menu when a
  More screen was opened from Home, a reminder or a link (no initial route on the More stack).
- Store screenshots (uncommitted, `feat/store-screenshots`): eight iPhone 6.9" screens in English and
  Arabic from a demo household (`mobile/src/dev/demo-data.ts`, Diagnostics in dev builds only; see
  `docs/store/screenshots/README.md`). Fixed on the way: Diagnostics no longer shows in release
  builds, chart axis labels are shortened on the phone (Hermes ignores Intl compact notation), and
  the net worth formula no longer shows "(BR-05)". Android screenshots are still to take.
- Store screenshots are on main (fd132a9). On `fix/sync-rejected-ops` (uncommitted, server on
  MizanApi `fix/sync-rejected-ops`, ADR sync-3): a change the server refuses on its own no longer
  stops sync; it is dropped from the outbox, kept on the device without values, and listed on the
  Sync screen (web and phone) with Dismiss. Checked on the iPhone against the dev API.
- The sync fix is on main (500d790). On `feat/mobile-reports` (uncommitted): Report a problem on the
  phone (list, new report with up to four images, thread with replies; T-support-reports), a reply
  push opens its report, and the bundled manual includes the support page.
- Report a problem is on main (ddbe965). On `fix/role-findings` (uncommitted), from a device check of
  roles, imports and receipts: advisors and dependents no longer show "sync failed" (quotes need
  HOUSEHOLD_VIEW, `mayReadQuotes` in core), signing out on the phone opens Sign in (not Reset), the
  join sheet no longer cuts off its button, and a member waiting for the household key is told so
  (`SyncStatus.awaitingKey`, Home and the advisor report on both apps). Checked on the iPhone.
- Role fixes are on main (abce124). On `fix/small-findings` (uncommitted): Settings on both apps hide
  what a role cannot use (advisor: Home cards, notifications, backup, your data; viewer: privacy
  defaults and imports), import previews name tables in the app language, pages pushed over the tabs
  show a plain back arrow instead of "(tabs)", and the reset email field autofills.
- Small findings are on main (33288d0). On `fix/arabic-digits` (uncommitted): dates and plain numbers
  follow the digit setting on both apps (`domain/digits.ts` in core: `withDigits`, `formatDateTime`,
  `formatNumber`; the phone's and web's `formatWhen`/`formatCount`; Hijri and Gregorian dates take the
  setting). Hermes ignores `-u-nu-` and browsers pick digits by region, so digits are set after
  formatting. A screen already open shows a new digit setting once it re-renders (as money did before).
- Arabic digits are on main (811effb). On `feat/mobile-any-currency` (uncommitted): any main currency on the
  phone (T-any-base-currency, ADR currency-1). Checked on the iPhone: a German sign-up gets EUR, a USD asset
  shows ≈ EUR, changing EUR→USD leaves it at exactly 1:1, switching the country to Iraq brings back the
  Baghdad dollar, show-amounts-in converts and its badge turns it off, Arabic search by currency name.
- Blocked on the owner (all in `docs/store/release-checklist.md`): `eas init`, EAS environment
  variables, Apple Developer with an APNs key, FCM, Play Console, the policy's contact address. Not logged in to Expo on this Mac. Open owner
  decisions: export compliance (`ITSAppUsesNonExemptEncryption`), the final brand icon.
- Next: once EAS exists, a real push to a device, TestFlight and Play internal testing. Phase 7
  (OCR) stays on hold. A full reload locks the app (the data key is in memory); fast refresh does
  not. Reopened months still count as the last close in the attribution (core, same on the web).
