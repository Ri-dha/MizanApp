# Mizan for iPhone and Android

Expo SDK 58 app sharing `../packages/core` with the web app (ADR mobile-1, mobile-2). Records
are end-to-end encrypted on the device and the local database is SQLCipher (ADR mobile-4), so it
needs a development build; Expo Go cannot run it.

```bash
npm install
npx --yes @expo/agent-cli@latest dev --ios --local --dev-client --device "iPhone 17" --detach
npx tsc --noEmit
```

For Android, stop the iOS dev server first (`npx --yes @expo/agent-cli@latest dev:stop`), then run
`dev --android --local --dev-client --device emulator-5554 --detach` with `adb` on PATH. Details:
`docs/learnings/2026-11-19-expo-agent-cli-dev-builds.md`.

The home screen is the diagnostics screen for now: it runs the shared vault vectors
(`shared/test-vectors/vault-*.json`) on this device's crypto. All must pass.
