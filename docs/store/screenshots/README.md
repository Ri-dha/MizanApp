# Store screenshots

`iphone-6.9/en` and `iphone-6.9/ar`: eight screens each at 1320 × 2868, the App Store's required
6.9-inch size (taken on the iPhone 18 Pro Max simulator, status bar set to 9:41). Order: Home,
Ledger, Plan, Net worth, Gold & silver, Goals, Bills, Monthly report.

The household is demo data, not a real person's: a fresh account on the local dev server, filled by
**Diagnostics → Load demo data** (`mobile/src/dev/demo-data.ts`, development builds only). The loader
writes names in the app's current language, so switch the language before loading.

To retake them:
1. Run the API (with the IQWealth key exported, so the dollar is live) and the dev server.
2. In the app: register a new account, verify it (the dev server logs the code), load demo data.
3. Open each screen once to dismiss its tour; open More screens from the More tab so the back button
   reads "More"; then `xcrun simctl io <device> screenshot <file>`.

Google Play needs its own set: Play allows at most a 2:1 aspect ratio, and these are 2.17:1.
