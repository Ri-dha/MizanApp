import { Platform, type TextStyle } from "react-native"

export { makeStyles, useAppStyle, useBrandColors, useColors, type BrandColors, type Palette } from "./colors"
export { PALETTES } from "./palettes"

const MONO = Platform.select({ ios: "Menlo", default: "monospace" })

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 } as const

export const radius = { sm: 8, md: 12, lg: 16, full: 9999 } as const

/**
 * The platform text ramp; Dynamic Type stays on, so rows grow with the reader's text size. Colour is
 * not part of it: `ThemedText` adds the template's label colour (ADR styles-1).
 */
export const type = {
  largeTitle: { fontSize: 34, fontWeight: "700" },
  title: { fontSize: 22, fontWeight: "600" },
  headline: { fontSize: 17, fontWeight: "600" },
  body: { fontSize: 17, fontWeight: "400" },
  subhead: { fontSize: 15, fontWeight: "400" },
  caption: { fontSize: 12, fontWeight: "400" },
  amount: { fontSize: 17, fontWeight: "500", fontVariant: ["tabular-nums"] },
  code: { fontSize: 20, fontFamily: MONO, letterSpacing: 1 },
  log: { fontSize: 11, fontFamily: MONO },
} as const satisfies Record<string, TextStyle>
