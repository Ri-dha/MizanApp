# 2026-11-22 — web sign-in
The refresh cookie is per host, not per port or tab: every Mizan tab on `localhost` (5173, 5175, …) shares one,
and in production two tabs of one browser do too. Signing in anywhere hands every other tab's next refresh that
account's token. The client now rejects a refreshed token whose subject is not the tab's session
(`web/src/api/client.ts`); when testing two accounts side by side, use different hosts (`a.localhost`, `[::1]`).
Source: T-unlock-other-account
