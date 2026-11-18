import { Platform, type TextStyle } from "react-native"

import { colors } from "./colors"

export { colors, useBrandColors, type BrandColors } from "./colors"

const MONO = Platform.select({ ios: "Menlo", default: "monospace" })

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 } as const

export const radius = { sm: 8, md: 12, lg: 16, full: 9999 } as const

/** The platform text ramp; Dynamic Type stays on, so rows grow with the reader's text size. */
export const type = {
  largeTitle: { fontSize: 34, fontWeight: "700", color: colors.label },
  title: { fontSize: 22, fontWeight: "600", color: colors.label },
  headline: { fontSize: 17, fontWeight: "600", color: colors.label },
  body: { fontSize: 17, fontWeight: "400", color: colors.label },
  subhead: { fontSize: 15, fontWeight: "400", color: colors.secondaryLabel },
  caption: { fontSize: 12, fontWeight: "400", color: colors.secondaryLabel },
  amount: { fontSize: 17, fontWeight: "500", color: colors.label, fontVariant: ["tabular-nums"] },
  code: { fontSize: 20, fontFamily: MONO, letterSpacing: 1, color: colors.label },
  log: { fontSize: 11, fontFamily: MONO, color: colors.label },
} as const satisfies Record<string, TextStyle>
