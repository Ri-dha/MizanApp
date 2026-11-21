# T-app-mode — Let each person choose a simple or an advanced app
- Status: in review
- Context: user request 2026-11-22 (plan "Simple and Advanced modes"); ADR mode-1. Server half in Ri-dha/mizan
  (`HomeLayoutSyncTable` accepts `appMode`).
- Notes:
  - Core: `domain/appMode.ts`, `appMode` in `SyncedPreferences`, `templatesFor` / `widgetsFor`, the `month`
    Home card and `monthFlow`.
  - Web: choice on Register and in Settings (`AppModeChoice`), `useAppMode`, `AreaGate` on hidden routes,
    nav and More filtered, quick add without buckets, Report without planned-versus-actual. Manual 23-modes.
  - Phone: only the `month` card and the stored preference so far; the simple navigation, the choice on
    register and in settings, and quick add without buckets are still to do (brief to the phone session).
