# T-synced-preferences — Reading preferences follow the person across devices
- Status: done (2026-11-21, on develop and main)
- Context: user request 2026-11-21; ADR home-2; builds on ADR home-1. Server part in Ri-dha/mizan.
- Notes: four fields on the `home_layout` row (`digitStyle`, `showUsd`, `showHijri`,
  `valuationReminderMonths`); core `saveSyncedPreferences`, `liveSyncedPreferences`,
  `reconcileSynced`; `SyncedPreferencesSync` in both apps; the web gained the valuation-months
  field it lacked. Checked web → phone and phone → web with the demo owner on the dev API;
  values stored as ciphertext only. Concurrent offline edits rely on field-level merge and were not
  tried by hand. Manual page 13-settings updated in both languages.
