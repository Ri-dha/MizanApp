# Release checklist — owner steps

The code side is ready (`mobile/eas.json`, icons, splash). These need the owner's accounts.

1. Expo: `npx eas-cli@latest login`, then in `mobile/` run `npx eas-cli@latest init`. Commit the
   `extra.eas.projectId` it writes to `app.json`.
2. EAS environment variables (`eas env:create`) for `preview` and `production`:
   `EXPO_PUBLIC_API_ORIGIN` (the API, https) and `EXPO_PUBLIC_WEB_ORIGIN` (the web app, used for
   join links). A release build without the API origin refuses to start, on purpose.
3. Apple Developer Program: create the app `iq.mizan.app` in App Store Connect. Run
   `npx eas-cli@latest credentials -p ios` to create the distribution certificate, profile and an
   APNs key (push).
4. Google: a Firebase project for `iq.mizan.app`; upload the FCM V1 service account key with
   `eas credentials -p android`. A Play Console app, and a service account for `eas submit`.
5. Server: set `mizan.notifications.expo.access-token` if Expo push security is enabled
   (RUNBOOK, MizanApi).
6. Build and submit:
   `npx eas-cli@latest build -p ios --profile production --auto-submit` (TestFlight) and
   `npx eas-cli@latest build -p android --profile production --auto-submit` (Play internal track).
7. Store pages: privacy policy URL `<web origin>/privacy.html`; paste `listing-en.md` and `listing-ar.md`, answer from `privacy.md`, add
   screenshots (iPhone 6.9", Android phone) in both languages, and a demo account for review.
8. Check on a real device: a reminder arrives, PBKDF2 unlock time on a mid-range Android.

## Owner decisions still open
- Export compliance (`ITSAppUsesNonExemptEncryption` in `app.json` `ios.infoPlist`): the app
  encrypts the user's own records with standard algorithms (AES-GCM, ECDH P-256). This is usually
  exempt, but the answer is a legal one; App Store Connect asks on every upload until it is set.
- The icon: `mobile/assets/brand/` holds an interim balance-scale glyph; replace it with the real
  brand artwork (see its README for how the PNGs are rendered).
- The contact address in `web/public/privacy.html` (both languages), and a support URL.
  The policy text describes what the code does today; have it reviewed before publishing.
