# ADR mobile-3 — The sync engine lives in core; each app supplies a host

- Date: 2026-11-18
- Status: accepted
- Task: T-mobile-app (Phase 2)

## Context
The sync loop (seal and push the outbox, pull and merge, open parked sealed rows, device duties)
is what makes two clients agree (ADR sync-1, e2e-1), so it must be one implementation. It was
written against browser globals (`navigator.onLine`, `visibilitychange`, Dexie's outbox hook) and
called web modules directly: sign-in and the session, receipt photos, backups, prices.

## Decision
- `packages/core/src/sync/engine.ts` holds the loop and its status (`syncStatus`,
  `subscribeSyncStatus`); `sync/duties.ts` the device duties. Each app starts it once with a
  `SyncHost`: its `Lifecycle` (online, offline, back on screen), the session and profile, whether
  the vault is open, what to do when the account's keys were replaced (ADR e2e-3), the device's
  name, and two hooks for its own steps at fixed points (`afterDuties`: receipt photos;
  `afterSync`: prices and the automatic backup).
- A sync is scheduled after a local write through `onLocalWrite` in `db/write.ts`, the only writer
  of the outbox, instead of a Dexie table hook.
- Generated API types mark every response field optional (springdoc). Core reads fields the server
  always sends through `required()`, which fails with `MALFORMED_RESPONSE` rather than carrying
  `undefined` into the local store.
- React stays in the apps: the web's `useSyncStatus` is a `useSyncExternalStore` over the core
  status.

## Consequences
- The phone app gets the same push, pull, merge and duties by writing a host of about thirty
  lines; `web/src/sync/engine.ts` is the web's.
- Core has an integration test that runs a first sync against a fake server and checks that only
  ciphertext leaves the device.
- Marking response fields required on the server (MizanApi) would let `required()` calls go.
