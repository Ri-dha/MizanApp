# ADR mobile-6 — Phone charts are drawn with react-native-svg

- Date: 2026-11-19
- Status: accepted
- Task: T-mobile-app (Phase 5 step 7)

## Context
The plan named a Skia-based chart library for the phone. The phone needs four charts, all lines
or stacked bars: the net worth trend, spending by bucket per month, sell-or-hold (cost against
value), and price history. A Skia library (victory-native) brings @shopify/react-native-skia,
needs a bundled font file for axis labels, and has its own interaction model; recharts, which the
web uses, does not run on React Native.

## Decision
- Charts are two small components in `mobile/src/components/charts`: `LineChart` (several
  series, dashed or stepped lines, gaps for missing days) and `StackedBarChart`, drawn with
  `react-native-svg` paths and rects. Axis labels and legends are ordinary text, so they follow
  the system font, Dynamic Type and light/dark colours.
- Charts stay left to right in Arabic (`direction: "ltr"`), as the web's `dir="ltr"` islands.
- Series colours come from the brand chart palette in `theme/colors.ts`.
- The data behind them is shared: price series and daily history moved to
  `packages/core/src/market/series.ts`; holdings series, net worth trend and year summaries were
  already in core.

## Consequences
- No tooltips or scrubbing yet; each chart sits beside the numbers it summarises (the change list,
  the month rows), so nothing is only readable from the chart.
- One native dependency (react-native-svg) instead of three; adding a chart type means a new
  component here rather than a library upgrade.
