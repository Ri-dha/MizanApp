# 2026-11-18 — Crypto on React Native (T-mobile-app Phase 1)

`react-native-quick-crypto` 1.1.10 (Nitro modules, Expo SDK 58, RN 0.88.1) runs the unchanged
`web/src/vault/crypto.ts` on iOS and Android and matches the web byte for byte. After calling
`install()` before any other import, `globalThis.crypto.subtle`, `getRandomValues` and
`randomUUID` are present, and Hermes supplies `TextEncoder`, `TextDecoder`, `btoa`, `atob` and
`String.prototype.normalize("NFKC")`. No `@noble/*` fallback is needed.

Checked by `spikes/rn-crypto` (18 cases, all passing on the iPhone 17 simulator and an Android
API 37 arm64 emulator): SHA-256; AES-GCM with and without AAD, wrong AAD rejected; PBKDF2
`deriveKey` to AES-KW (lock) and to AES-GCM with JWK export/import (backup); AES-KW wrap and
unwrap; ECDH P-256 pkcs8, spki, raw and JWK import/export and `deriveBits`; HKDF with and without
salt; non-extractable AES-GCM keys refuse export (keyring device key). With the real vault module:
identifier normalisation, NFKC of an Arabic password with presentation forms, `derivePasswordKeys`,
`deterministicId`, opening a Node-made account by password and recovery code, opening a Node-made
grant and sealed fields; and the reverse: an account, grant and fields made on the phone open in
Node.

How to rerun: `node harness/server.ts` (port 8787), then `npx expo run:ios` or install the Android
debug build. The app reaches the server at `localhost`; on Android use `adb reverse tcp:8787
tcp:8787` and `adb reverse tcp:8081 tcp:8081`. Reaching the Mac at `10.0.2.2` instead triggers
Android's local-network permission prompt.

Not yet measured: PBKDF2 600k on a real mid-range phone. The simulator and emulator run on the
Mac's CPU (iOS 38 ms, Android 109 ms, Node 47 ms per `derivePasswordKeys`), so they say nothing
about a phone. Time it on a real device before release; it runs once per sign-in.

Build notes: CocoaPods is not part of Xcode (`brew install cocoapods`, `LANG=en_US.UTF-8`). Gradle
uses Android Studio's bundled JDK (`~/Applications/Android Studio.app/Contents/jbr/Contents/Home`),
and the first Android build downloads NDK 27.1 and takes about 30 minutes.

Source: T-mobile-app Phase 1
