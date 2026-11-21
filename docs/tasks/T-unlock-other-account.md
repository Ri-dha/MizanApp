# T-unlock-other-account — A tab must not take over another account's refresh
- Status: done (2026-11-22, merged to develop and main)
- Context: the web unlock screen refused the right password; ADR e2e-3 (keys replaced); learning 2026-11-22-refresh-cookie-per-host.
- Notes: a refresh could return a token for whoever signed in last on this host. The tab then saw "new" keys,
  wiped the device and adopted that session, so the password was checked against the other account.
  `web/src/api/client.ts` now compares the refreshed token's subject with the tab's session: same account is
  kept; if this browser's stored session is the new account (another tab signed in here) the tab reloads; otherwise
  the tab is signed out. Covered by `web/src/api/client.test.ts`; checked in the browser with two dev ports.
