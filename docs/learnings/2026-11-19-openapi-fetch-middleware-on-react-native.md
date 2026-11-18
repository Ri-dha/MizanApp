# 2026-11-19 — openapi-fetch middleware on React Native

openapi-fetch 0.17 checks that an `onResponse` middleware returns its own `Response` class. React
Native's `fetch` returns a different one, so any `onResponse` (even one returning the response it
was given) throws "onResponse: must return new Response() when modifying the response". On the
phone the token and the retry after a refresh therefore live in a custom `fetch` passed to
`createClient({ fetch })` (`mobile/src/platform/api-client.ts`); the web keeps its middleware.

Also: `unwrap` used to turn every rejection into a bare `NETWORK` error, which hid this. It now
keeps the cause in `ApiError.properties.cause`.

Source: T-mobile-app Phase 4
