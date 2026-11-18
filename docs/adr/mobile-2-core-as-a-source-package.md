# ADR mobile-2 — The shared core is a source package compiled by each app

- Date: 2026-11-18
- Status: accepted
- Task: T-mobile-app (Phase 2)

## Context
ADR mobile-1 puts the code every client shares in `packages/core` and planned npm workspaces at
the repository root. Workspaces hoist dependencies into one `node_modules`, and the two apps pin
different versions of the same libraries (the web is on React 19.2, Expo SDK 58 on React 19.3 and
React Native 0.88). Hoisting would need overrides and would change how the web Dockerfile and CI
install. Core itself needs no runtime library: it is domain maths, record types, the vault, the
clock and merge, receipt parsing, translations and the API types.

## Decision
- `packages/core` is plain TypeScript source with **no runtime dependencies**, imported as
  `@mizan/core/<path>` through an alias in each app (Vite and TypeScript `paths` in `web/`, Metro
  in `mobile/`). Each app compiles it with its own toolchain and keeps its own `node_modules` and
  lockfile. There are no npm workspaces.
- Core has its own `package.json` only for its tests (Vitest in Node) and type check.
- Core type-checks against ES2023 plus the Node globals, never the DOM, so a browser-only global
  (`window`, `document`, `navigator`, `localStorage`) does not compile. The WebCrypto key types
  come from `src/platform/webcrypto.d.ts`. Core may use only what the browser, Node and React
  Native (after `react-native-quick-crypto`'s `install()`) all provide: `crypto.subtle`,
  `crypto.getRandomValues`, `crypto.randomUUID`, `TextEncoder`, `TextDecoder`, `btoa`, `atob`,
  `Intl`. Node-only APIs are not caught by the compiler; the phone runs core's test vectors to
  catch them.
- Anything an app must supply (storage, the device secret store, online and foreground events,
  user preferences such as digit style) reaches core as a parameter or an interface, never an
  import from an app.

## Consequences
- The web app, its Docker image and its CI install exactly as before; the image also copies
  `packages/core`. CI gains a core job, and a change under `packages/core` runs both.
- A library core would need must be added to both apps, or core must stay free of it; this keeps
  the boundary honest.
- Moving a file to core means rewriting its imports to `@mizan/core/...`; web files that only
  re-export (`web/src/db/schema.ts`, `web/src/ocr/receipt.ts`, `web/src/app/money.ts`) keep the
  web's own paths stable where many screens use them.
