# 2026-11-19 — Help on the phone
Metro cannot import Markdown the way Vite's `import.meta.glob(..., { query: "?raw" })` does, so the
phone reads the manual from `mobile/src/help/manual.generated.ts`, written by
`npm run manual` (in `mobile/`) from `docs/manual`. After editing any page in `docs/manual`, run it
and commit the generated file with the change, or the phone shows the old text. Parsing (front
matter, language fallback, search) is shared in `packages/core/src/help/manual.ts`; the phone
renders only the Markdown the manual uses (headings, paragraphs, lists, tables, bold, inline code)
in `mobile/src/components/markdown.tsx`.
Source: T-mobile-app Phase 5 step 5
