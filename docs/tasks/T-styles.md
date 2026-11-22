# T-styles — Let each person choose one of three templates
- Status: in-progress (2026-11-22)
- Context: ADR styles-1; canvases "Mizan colour redesign", "Mizan redesign" (Clear), "Mizan Redesign" (Soft) in Claude Design; server half in MizanApi `docs/tasks/T-styles.md`.
- Notes: staged. 0 foundation and a Plan pilot; 1 the Clear and Mizan canvases extended to every page;
  2 every page gets its hook and Soft view (the fallback); 3 Clear and Mizan views; 4 manual, status, handover.
  Done so far: `appStyle` preference and sync, picker on Register and Settings, and Plan in all three
  templates, on the website and the phone app. Web: tokens per template, `styleViews`. Phone:
  `theme/palettes.ts`, `useColors` and `makeStyles` in place of the platform colours, navigation chrome
  themed in `app/_layout.tsx`. Checked on the iOS simulator in light and dark, and a change made on the
  website reached the phone through sync.
  Not yet: fonts self-hosted per template, PWA caching per template, Android emulator run, all other pages.
  Pattern to copy for a page: web `features/plan/usePlanPage.ts`, `PlanPage.tsx`, `views/`; phone
  `screens/plan/use-plan-screen.ts`, `index.tsx`, `views/`.
  The dev API must be rebuilt from this branch for `appStyle` to sync (an older jar drops the field).
