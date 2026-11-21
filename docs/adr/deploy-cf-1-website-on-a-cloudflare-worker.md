# ADR deploy-cf-1 — The website on a Cloudflare Worker

- Date: 2026-11-21
- Status: accepted
- Task: T-cloudflare-worker

## Context
The website was only ever served by Caddy next to the API (web/Dockerfile). The user wants it on
Cloudflare. The app calls the API on its own origin (`/api`), and the refresh token is a
first-party cookie, so the site and the API must look like one origin to the browser.

## Decision
- `web/wrangler.jsonc` publishes `dist` as Worker static assets, with single-page fallback.
  Only `/api/*` runs the Worker (`web/worker/index.ts`), which forwards it to `API_ORIGIN`
  unchanged, passing the caller's address as X-Forwarded-For.
- The security headers are Caddy's (`infra/caddy/security-headers.caddy`), written to
  `dist/_headers` by `scripts/cloudflare-headers.mjs` with storage on the site itself.
- The API must list the Worker's address in `MIZAN_ALLOWED_ORIGINS`; other origins stay refused.
- `npm run cf:deploy -- --var API_ORIGIN:<api address>` builds and publishes.

## Consequences
Storage is not proxied: signed upload links name one host, which a forwarding Worker does not
keep, so receipt photos and backups need storage on its own address (or Caddy) in a real
deployment. The first deployment (2026-11-21) points at a quick Cloudflare Tunnel to a
development Mac: for trying the site only, it stops when the Mac or the tunnel does, and its
address changes on every tunnel start (redeploy with the new one).
