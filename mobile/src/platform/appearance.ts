import { getLocales } from "expo-localization"
import { Appearance, I18nManager } from "react-native"

import type { LanguageChoice, ThemeChoice } from "@/preferences"

export const SUPPORTED_LOCALES = ["en", "ar"] as const
export type Locale = (typeof SUPPORTED_LOCALES)[number]

export function localeFor(choice: LanguageChoice): Locale {
  if (choice !== "system") return choice
  const device = getLocales()[0]?.languageCode ?? "en"
  return (SUPPORTED_LOCALES as readonly string[]).includes(device) ? (device as Locale) : "en"
}

export function applyTheme(choice: ThemeChoice) {
  Appearance.setColorScheme(choice === "system" ? "unspecified" : choice)
}

/**
 * React Native fixes the layout direction at launch and remembers the forced value across launches,
 * so the wanted direction is always recorded and a change shows on the next start.
 */
export function directionNeedsRestart(locale: Locale): boolean {
  const rtl = locale === "ar"
  I18nManager.allowRTL(rtl)
  I18nManager.forceRTL(rtl)
  return I18nManager.isRTL !== rtl
}
