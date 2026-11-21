# T-cloudflare-worker — Run the website on a Cloudflare Worker
- Status: in review
- Context: user request 2026-11-21; API reached through a quick tunnel to the development Mac for now. ADR deploy-cf-1.
- Notes: `web/worker/index.ts`, `web/wrangler.jsonc`, `web/scripts/cloudflare-headers.mjs`, scripts `cf:build` and
  `cf:deploy`; wrangler is a dev dependency. Deployed as `mizan` on workers.dev. Storage (photos, backups) not proxied yet.
