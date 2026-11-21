# T-app-mode — Let each person choose a simple or an advanced app
- Status: done (5b4da93)
- Context: user request 2026-11-22 (plan "Simple and Advanced modes"); ADR mode-1. Server half in Ri-dha/mizan
  (`HomeLayoutSyncTable` accepts `appMode`).
- Notes:
  - Core: `domain/appMode.ts`, `appMode` in `SyncedPreferences`, `templatesFor` / `widgetsFor`, the `month`
    Home card and `monthFlow`.
  - Web: choice on Register and in Settings (`AppModeChoice`), `useAppMode`, `AreaGate` on hidden routes,
    nav and More filtered, quick add without buckets, Report without planned-versus-actual. Manual 23-modes.
  - Phone (2026-11-22): `useAppMode`, `AppModeChoice` on Register and in Settings, `AreaGate`
    on the plan, bills, income, goals, metals, assets, net worth, household and year report routes, the Plan tab
    and More list filtered, Home cards and card templates by mode (arrows move among the shown cards), the net
    worth note and Cash link, no stale-valuation prompt, add transaction without buckets or split, Report from
    `monthFlow`, Settings without Household and privacy. Checked on the simulator in Arabic; registering a new
    account with the choice was not tried by hand.
