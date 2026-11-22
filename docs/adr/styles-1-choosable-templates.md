# ADR styles-1 — Three templates, chosen by each person

- Date: 2026-11-22
- Status: accepted
- Task: T-styles
- Supersedes: the token values of ADR ui-1 and the platform colours of ADR mobile-5 (their other decisions stand)

## Context
Three finished directions exist in Claude Design: "Mizan colour redesign" (lapis, navy sidebar, gold
accent), "Mizan redesign" (light, large dark headline cards, pill buttons) and "Mizan Redesign"
(petrol, compact tables). They differ in page layout, not only colour. The owner chose
(2026-11-22) to offer all three and to copy each canvas in full, instead of picking one or
sharing one layout across them.

Options considered: tokens only (cheapest, pages would not match the canvases); one shared layout
with per-template signature parts; a full layout per template (chosen).

## Decision
- Three templates: `mizan` (default), `clear`, `soft` (`packages/core/src/domain/appStyle.ts`).
  The app never shows another company's brand name for them.
- The choice is a reading preference like `appMode` (ADR mode-1): `appStyle` on the sealed
  `home_layout` row, cached per device, picked on the register screen and in Settings. The server
  enforces nothing.
- Web tokens: one block per template in `web/src/index.css`, selected by `data-style` on the page
  element next to `.dark`. `public/theme-boot.js` sets it before first paint from the cached
  preferences. The selectors also work on an inner element, which the picker uses for previews.
- Layout: a page keeps its state and actions in one hook (`usePlanPage`) and draws through
  `styleViews({ soft, clear, mizan })` from `web/src/app/style.tsx`. Views are lazy, so a person
  downloads one template's layouts. Business rules stay in the hook and in `packages/core`.
- Fallback: a template without its own view for a page uses the Soft view in its own colours
  (`viewFor`). Soft is the complete drawn set, so every template is usable while views are added.
- Bucket colours stay stored on the bucket; a new bucket takes the next preset of the template in
  use (`BUCKET_PRESETS`).

## Consequences
- Every page is built and tested three times; a new feature needs three views or lives with the
  fallback until they exist.
- Screens use tokens only (`text-link`, `bg-hero`, `bg-success-soft`, `shadow-card`); a raw colour
  in a view breaks the other templates and dark mode.
- Switching template offline works only for layouts already fetched; the rest need one online visit.
- Material You dynamic colour and the iOS system palette are replaced by the template palette on phones.
