# 2026-11-19 — App config changes need a prebuild
`mobile/ios` (and `android`) are generated and gitignored. `npx expo run:ios` reuses an existing
`ios/` folder and does not re-apply `app.json`, so a new config plugin or permission text never
reaches the built app. Adding expo-image-picker's photo and camera messages this way built fine,
then the app was killed by iOS the moment it opened the photo library ("attempted to access
privacy-sensitive data without a usage description"). After changing plugins or permissions in
`app.json`, run `npx expo prebuild --platform ios` (and android) before `run:ios`, and check
`ios/Mizan/Info.plist` for the key.
Source: T-mobile-app Phase 5 step 6
