# 2026-11-18 — Dexie live queries and the core store

`useLiveQuery` only re-runs when it saw the reads, and Dexie only records a read while its own
promise chain is being awaited. A helper written as an `async` function returns a native promise;
once a live querier awaits one, every read after it is invisible and the screen stops updating,
with no error. The month view (ledger, plan) awaits several reads in a row, so it was the first to
break when `rows`, `rowsBy` and `sorted` in `packages/core/src/store/store.ts` were `async`.

Rule: store helpers chain with `.then` on the adapter's promises and are never `async`
functions. Core code that composes reads (`monthViewFor`, `figureOver`) may use `async`/`await`
as before, as long as what it awaits comes from the store. `web/src/platform/liveQuery.test.ts`
covers a single read and the month view; both must stay green.

Also seen while testing: editing a core module while Vite runs can leave two copies of a module in
the page (one with `?t=`). With two copies of `api/client.ts`, two token refreshes ran at once,
the second was refused (refresh tokens rotate), and the device cleared its local data. Restart the
dev server after editing core files before judging live behaviour.

Source: T-mobile-app Phase 2
