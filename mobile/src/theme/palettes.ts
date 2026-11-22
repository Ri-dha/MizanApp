import type { AppStyle } from "@mizan/core/domain/appStyle"

/** ADR styles-1: one palette per template and scheme, the same values as the web tokens in `web/src/index.css`. */
export interface Palette {
  /** The screen behind lists and cards. */
  background: string
  /** Cards and grouped-list cells. */
  surface: string
  /** Sheets, menus and dialogs. */
  surfaceRaised: string
  /** Inputs, unselected chips, tracks, disabled controls. */
  fill: string
  label: string
  secondaryLabel: string
  /** Placeholders and disabled text. */
  tertiaryLabel: string
  separator: string
  /** Field and unselected chip borders. */
  outline: string
  /** One main button per screen, the selected tab, focus. */
  primary: string
  onPrimary: string
  /** Text links and quiet actions; lighter than `primary` where that is a fill. */
  link: string
  /** Info banners and the selected chip. */
  accent: string
  onAccent: string
  success: string
  successSurface: string
  warning: string
  warningSurface: string
  destructive: string
  destructiveSurface: string
  onDestructive: string
  gold: string
  goldSurface: string
  /** The headline card of a screen. */
  hero: string
  onHero: string
  heroMuted: string
  /** Chart series: 1 main, 2 loss, 3 gold, 4 gain, 5 extra. */
  chart: readonly string[]
  /** Bucket presets. */
  buckets: readonly string[]
}

const mizanLight: Palette = {
  background: "#f3f5f9", surface: "#ffffff", surfaceRaised: "#ffffff", fill: "#e6ebf4",
  label: "#0f1b33", secondaryLabel: "#566178", tertiaryLabel: "#6a7387", separator: "#dde3ec", outline: "#8590a3",
  primary: "#1f4aa8", onPrimary: "#ffffff", link: "#1f4aa8", accent: "#e6edfa", onAccent: "#1f4aa8",
  success: "#0a7466", successSurface: "#e0f2ef", warning: "#9a5200", warningSurface: "#fcefd8",
  destructive: "#b8322a", destructiveSurface: "#fbe8e6", onDestructive: "#ffffff",
  gold: "#ad7c0c", goldSurface: "#f8eed4", hero: "#0f1b33", onHero: "#ffffff", heroMuted: "#d3dbea",
  chart: ["#2f5fc4", "#d0453a", "#b07f0d", "#10897a", "#7b5bc2"],
  buckets: ["#2f5fc4", "#10897a", "#b07f0d", "#c4523b", "#8b4fa6", "#6a8a26", "#5b6b86", "#c24d78"],
}

const mizanDark: Palette = {
  background: "#0b1220", surface: "#131c2e", surfaceRaised: "#18233a", fill: "#1f2a40",
  label: "#e8edf6", secondaryLabel: "#9aa6bc", tertiaryLabel: "#7f8aa0", separator: "#26324a", outline: "#66748f",
  primary: "#86a8f2", onPrimary: "#0b1220", link: "#86a8f2", accent: "#18284a", onAccent: "#86a8f2",
  success: "#4cc4ad", successSurface: "#0f302b", warning: "#f0b354", warningSurface: "#36290f",
  destructive: "#f07a6e", destructiveSurface: "#3a1d1d", onDestructive: "#0b1220",
  gold: "#e2b54b", goldSurface: "#332810", hero: "#18233a", onHero: "#ffffff", heroMuted: "#c9d3e6",
  chart: ["#7ea2f0", "#f07a6e", "#e8b54a", "#4cc4ad", "#a98cf0"],
  buckets: ["#7ea2f0", "#4cc4ad", "#e8b54a", "#ee8a6f", "#c08ee0", "#a6c45a", "#9aa9c4", "#f08bb0"],
}

const clearLight: Palette = {
  background: "#f5f5f7", surface: "#ffffff", surfaceRaised: "#ffffff", fill: "#e8e8ed",
  label: "#1d1d1f", secondaryLabel: "#515154", tertiaryLabel: "#6e6e73", separator: "#e0e0e0", outline: "#8e8e93",
  primary: "#0066cc", onPrimary: "#ffffff", link: "#0066cc", accent: "#e8f1fb", onAccent: "#003e7a",
  success: "#12692f", successSurface: "#e6f4ea", warning: "#b25000", warningSurface: "#fff2e0",
  destructive: "#d70015", destructiveSurface: "#fdecee", onDestructive: "#ffffff",
  gold: "#8a6100", goldSurface: "#f8efd9", hero: "#1d1d1f", onHero: "#ffffff", heroMuted: "#c7c7cc",
  chart: ["#0071e3", "#d70015", "#8a6100", "#1b7f3a", "#8944ab"],
  buckets: ["#0071e3", "#c45500", "#1b7f3a", "#8944ab", "#007d94", "#c3135e", "#8a6100", "#5146d6"],
}

const clearDark: Palette = {
  background: "#000000", surface: "#1c1c1e", surfaceRaised: "#1c1c1e", fill: "#2c2c2e",
  label: "#f5f5f7", secondaryLabel: "#aeaeb2", tertiaryLabel: "#8e8e93", separator: "#38383a", outline: "#6e6e73",
  primary: "#0066cc", onPrimary: "#ffffff", link: "#2997ff", accent: "#0b2a4a", onAccent: "#cfe6ff",
  success: "#30d158", successSurface: "#0f2e19", warning: "#ff9f0a", warningSurface: "#3a2606",
  destructive: "#ff6961", destructiveSurface: "#3a1513", onDestructive: "#000000",
  gold: "#e6b450", goldSurface: "#33270c", hero: "#0b2a4a", onHero: "#ffffff", heroMuted: "#cfe6ff",
  chart: ["#2997ff", "#ff6961", "#e6b450", "#30d158", "#bf5af2"],
  buckets: ["#2997ff", "#ff9f0a", "#30d158", "#bf5af2", "#40c8e0", "#ff5c8a", "#e6b450", "#8c88ff"],
}

const softBuckets = ["#2985df", "#cc6600", "#0a9645", "#976dd9", "#009294", "#d5587c", "#ae7800", "#768595"] as const

const softLight: Palette = {
  background: "#f1f6f8", surface: "#ffffff", surfaceRaised: "#ffffff", fill: "#e7ecee",
  label: "#1f2528", secondaryLabel: "#3d4346", tertiaryLabel: "#5c6266", separator: "#dce1e3", outline: "#878b8d",
  primary: "#007c8d", onPrimary: "#ffffff", link: "#006d7e", accent: "#dcf8fd", onAccent: "#006d7e",
  success: "#107c10", successSurface: "#f1faf1", warning: "#bc4b09", warningSurface: "#fff9f5",
  destructive: "#b10e1c", destructiveSurface: "#fdf3f4", onDestructive: "#ffffff",
  gold: "#6c5700", goldSurface: "#fdfbf2", hero: "#ffffff", onHero: "#1f2528", heroMuted: "#5c6266",
  chart: ["#007c8d", "#c50f1f", "#b27c00", "#218c21", "#881798"],
  buckets: softBuckets,
}

const softDark: Palette = {
  background: "#101518", surface: "#242a2d", surfaceRaised: "#2e3437", fill: "#33393c",
  label: "#ffffff", secondaryLabel: "#d2d7d9", tertiaryLabel: "#a9aeb0", separator: "#3d4346", outline: "#7d8183",
  primary: "#006d7e", onPrimary: "#ffffff", link: "#15adbf", accent: "#002a35", onAccent: "#5cc3d2",
  success: "#9fd89f", successSurface: "#052505", warning: "#faa06b", warningSurface: "#4a1e04",
  destructive: "#f66c6d", destructiveSurface: "#3b0509", onDestructive: "#101518",
  gold: "#ecdfa5", goldSurface: "#3a2f00", hero: "#242a2d", onHero: "#ffffff", heroMuted: "#a9aeb0",
  chart: ["#15adbf", "#dc626d", "#edad1c", "#54b054", "#b55fc1"],
  buckets: softBuckets,
}

export const PALETTES: Record<AppStyle, { light: Palette; dark: Palette }> = {
  mizan: { light: mizanLight, dark: mizanDark },
  clear: { light: clearLight, dark: clearDark },
  soft: { light: softLight, dark: softDark },
}
