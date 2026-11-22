# T-styles — Let each person choose one of three templates
- Status: in-progress (2026-11-22)
- Context: ADR styles-1; canvases "Mizan colour redesign", "Mizan redesign" (Clear), "Mizan Redesign" (Soft) in Claude Design; server half in MizanApi `docs/tasks/T-styles.md`.
- Notes: staged. 0 foundation and a Plan pilot; 1 the Clear and Mizan canvases extended to every page;
  2 every page gets its hook and Soft view (the fallback); 3 Clear and Mizan views; 4 manual, status, handover.
  Done so far (web): `appStyle` preference and sync, tokens for the three templates, picker on Register and
  Settings, `styleViews`, Plan in all three. Not yet: fonts self-hosted per template, PWA caching per
  template, the phone app (palettes, `useColors`, picker, Plan pilot), all other pages.
  Pattern to copy for a page: `web/src/features/plan/usePlanPage.ts`, `PlanPage.tsx`, `views/`.
