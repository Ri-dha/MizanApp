# Privacy answers — App Store privacy label and Play data safety

Basis: ADR e2e-1 (records sealed on the device), ADR push-1 (only the push token and reminder
kind reach the server). No analytics, advertising or crash-reporting SDK is in the app.

## Collected and linked to the user (App Store: "Data Linked to You")
| Data | Why | Notes |
|---|---|---|
| Email address or phone number | App functionality (account) | The sign-in identifier |
| Name | App functionality | The display name shown to household members |
| Device ID | App functionality | The Expo push token, only when the user turns on phone reminders |
| Other (IP address, device name) | App functionality (security) | Recorded on each session and in the account audit trail; not used for location or tracking |

## Financial info and user content
Transactions, balances, assets, debts, notes and receipt photos are end-to-end encrypted on the
device; the server holds ciphertext it cannot read. Apple: data the developer cannot access in
readable form is not "collected", so leave these unticked. Play: answer "Data is encrypted in
transit: yes" and do not declare financial info as collected, for the same reason. Revisit if any
server feature ever reads them.

## Not collected
Location, contacts, browsing, search history, diagnostics, usage data, advertising identifiers.

## Other answers
- Tracking (App Store): no. Data shared with third parties (Play): no; Expo and APNs/FCM are
  processors that deliver notifications.
- Account deletion: in Settings on the phone and the web; the account is purged 30 days later
  and can be cancelled until then (FR-ACC-08).
- Privacy policy URL: `<web origin>/privacy.html` (`web/public/privacy.html`, English and Arabic,
  linked from Help in both apps). Its contact address is a placeholder the owner fills in.
- Camera and photo library: used only to attach receipt photos, which are encrypted before upload.
