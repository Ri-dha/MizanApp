import { useMemo } from "react"
import { useColorScheme, type ImageStyle, type TextStyle, type ViewStyle } from "react-native"

import type { AppStyle } from "@mizan/core/domain/appStyle"
import { usePreferences } from "@/preferences"
import { PALETTES, type Palette } from "./palettes"

export type { Palette } from "./palettes"

export function useAppStyle(): AppStyle {
  return usePreferences().appStyle
}

/**
 * ADR styles-1: the chosen template's colours for the device's light or dark setting. They replace
 * the platform palette (iOS system colours, Material You), so a screen looks the same on both.
 */
export function useColors(): Palette {
  const scheme = useColorScheme() === "dark" ? "dark" : "light"
  return PALETTES[useAppStyle()][scheme]
}

/** The older name for the part of the palette that came from the web tokens (ADR mobile-5). */
export type BrandColors = Palette
export const useBrandColors = useColors

type Styles = Record<string, ViewStyle | TextStyle | ImageStyle>

/** A stylesheet that needs the palette: `const useStyles = makeStyles((colors) => ({ … }))`, then `const styles = useStyles()`. */
export function makeStyles<T extends Styles>(build: (colors: Palette) => T): () => T {
  return function useStyles() {
    const colors = useColors()
    return useMemo(() => build(colors), [colors])
  }
}
