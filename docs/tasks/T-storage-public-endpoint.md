# T-storage-public-endpoint — Presign storage URLs a browser can reach
- Status: in-review (2026-11-19); server half b48b895 in MizanApi, this half on branch
  feat/storage-same-origin (MizanApp) with a one-line compose change in MizanApi, uncommitted
- Context: ADR storage-4 (a copy is here; the original is in MizanApi). Owner chose the site's
  own address over a storage subdomain.
- Notes: Caddy `handle /{$MIZAN_STORAGE_BUCKET:mizan-attachments}/*` → `seaweedfs:8333` before the
  SPA fallback; the CSP keeps its optional storage slot, empty in a deployment (MizanApi compose
  default changed to empty). Checked end to end: the production web image (Caddy + built app)
  with SeaweedFS and the API signing for the site: a receipt uploaded through the site, fetched
  back after its local copy was dropped, decrypted and shown, with no CSP violation. Also fixed:
  the web image did not build, since `packages/core` resolves `openapi-fetch` from its own
  `node_modules`, which the Dockerfile never installed.
