# 2026-11-19 — Building the web image
`packages/core` is plain source with its own `package.json` and lockfile (no npm workspace). Its
imports (for example `openapi-fetch`) resolve from `packages/core/node_modules`, never from
`web/node_modules`, because Node looks only in parent folders of the importing file. A checkout
works because both folders were installed; `web/Dockerfile` installed only `web/`, so
`tsc -b` failed with "Cannot find module 'openapi-fetch'" and a cascade of `unknown` types. The
Dockerfile now runs `npm ci` in `packages/core` too. Build the image after any change to core's
dependencies: `docker build -f web/Dockerfile .` from the repo root.
Source: T-storage-public-endpoint
