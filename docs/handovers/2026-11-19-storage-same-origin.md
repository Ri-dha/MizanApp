# Handover — 2026-11-19 — Storage on the site's own address (web half)

## Completed (on develop and main in both repos)
- MizanApp: Caddy storage route, CSP comment, `web/Dockerfile` installs core's packages, a Caddy
  route test in `securityHeaders.test.ts`, ADR storage-4 copy, ARCHITECTURE, task, learning.
- MizanApi: the web service's `MIZAN_STORAGE_ORIGIN` defaults to empty and it gets
  `MIZAN_STORAGE_BUCKET`; `.env.example`.

## In flight
- Nothing. MizanApp f53b409 and MizanApi 1e973a6, on develop and main.

## Next steps
- On a real host: set `MIZAN_STORAGE_PUBLIC_ENDPOINT=https://<host>` and try a receipt.

## Blockers
- None.

## Gotchas hit this session
- Port 8080 had an API started from IntelliJ and 8081 had Metro; the test API ran on 8091 with a
  copy of the Caddyfile pointing there.
- The first `[role=dialog]` can be the recovery-code dialog behind the sheet; select by title.
