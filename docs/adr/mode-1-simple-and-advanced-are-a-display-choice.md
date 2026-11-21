# ADR mode-1 — Simple and advanced are a display choice

- Date: 2026-11-22
- Status: accepted
- Task: T-app-mode

## Context
Mizan grew to about twenty screens. Many people only want to know where the month's money went and
what they have left. The person asked for a simple version chosen per person, with debts kept in
it, the Home total still counting everything, and the household left out.

## Decision
- Each person has an `appMode`, "simple" or "advanced", stored with the reading preferences on
  their private Home layout row (ADR home-2) so it follows them. A device without one is advanced,
  so nobody from before the choice sees a change. New accounts choose at registration.
- The mode only hides things. `shows(mode, area)` in `packages/core/src/domain/appMode.ts` is the
  one test; screens, nav links, Home card templates and form fields are tagged with an area
  (plan, bills, income, goals, metals, assets, networth, household, yearReport). The server does
  not know the mode and enforces nothing.
- Nothing stored changes with the mode: hidden cards stay in the layout, a hidden screen opened by
  URL shows a way back to advanced, and net worth counts every class in both modes, with a note in
  simple mode when it includes classes that mode does not show.
- Simple mode has no buckets, so its month is `monthFlow`: income receipts and income transactions
  in, every expense out. The `month` Home card and the simple Report use it.
- Dependants and advisors keep their own cut-down navigation; the mode does not apply to them.

## Consequences
A simple-mode member of a shared household sees transactions another member tied to a bucket or
bill without those details, and must not erase them: forms write only the fields they show.
Charging for advanced mode later would need server enforcement, which this does not provide.
