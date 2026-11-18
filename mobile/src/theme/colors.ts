import { Color } from "expo-router"
import { Platform, useColorScheme } from "react-native"

/** Platform semantic colours: they resolve on the device and follow light and dark by themselves. */
export const colors = {
  label: Platform.select({ ios: Color.ios.label, android: Color.android.dynamic.onSurface, default: "#0a0a0a" })!,
  secondaryLabel: Platform.select({ ios: Color.ios.secondaryLabel, android: Color.android.dynamic.onSurfaceVariant, default: "#696969" })!,
  tertiaryLabel: Platform.select({ ios: Color.ios.tertiaryLabel, android: Color.android.dynamic.outline, default: "#a1a1a1" })!,
  separator: Platform.select({ ios: Color.ios.separator, android: Color.android.dynamic.outlineVariant, default: "#e5e5e5" })!,
  background: Platform.select({ ios: Color.ios.systemGroupedBackground, android: Color.android.dynamic.surface, default: "#ffffff" })!,
  surface: Platform.select({ ios: Color.ios.secondarySystemGroupedBackground, android: Color.android.dynamic.surfaceContainer, default: "#f5f5f5" })!,
  fill: Platform.select({ ios: Color.ios.tertiarySystemFill, android: Color.android.dynamic.surfaceContainerHighest, default: "#f5f5f5" })!,
}

/**
 * ADR mobile-5: the brand comes from the web's shadcn tokens (web/src/index.css), converted from
 * OKLCH, so the two apps read as one product.
 */
const brandPalette = {
  light: {
    primary: "#2e62c9", onPrimary: "#fafafa", accent: "#ecf2fc", destructive: "#e7000b", onDestructive: "#ffffff",
    chart: ["#447be4", "#e23439", "#ecaa0b", "#1eab53", "#8a63de"],
  },
  dark: {
    primary: "#73a3fc", onPrimary: "#0a111f", accent: "#232b3a", destructive: "#ff6467", onDestructive: "#0a0a0a",
    chart: ["#6a9cfb", "#ff645f", "#f7b83d", "#51c672", "#a787f6"],
  },
} as const

export type BrandColors = (typeof brandPalette)["light"] | (typeof brandPalette)["dark"]

export function useBrandColors(): BrandColors {
  return brandPalette[useColorScheme() === "dark" ? "dark" : "light"]
}
