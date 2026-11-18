# Status — mobile-app
- Branch: `feat/mobile-crypto-spike` from develop (588eddf); uncommitted.
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
- Next: Phase 2, the shared core package. Blockers: none.
- Validated: spike results in `spikes/rn-crypto/harness/out/` (gitignored), rerun steps in the learning.
