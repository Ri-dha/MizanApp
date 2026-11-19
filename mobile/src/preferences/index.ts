import { useSyncExternalStore } from "react"
import Storage from "expo-sqlite/kv-store"

import type { DigitStyle } from "@mizan/core/domain/money/format"

export type LanguageChoice = "system" | "en" | "ar"
export type ThemeChoice = "system" | "light" | "dark"

/** Per device, as on the web; read before unlock, so nothing here is sensitive. */
export interface Preferences {
  language: LanguageChoice
  theme: ThemeChoice
  digitStyle: DigitStyle
  showUsd: boolean
  showHijri: boolean
  /** FR-AST-04: months after which an asset without a fresh valuation is flagged. */
  valuationReminderMonths: number
}

const KEY = "mizan.preferences"
const DEFAULTS: Preferences = { language: "system", theme: "system", digitStyle: "western", showUsd: false, showHijri: false, valuationReminderMonths: 6 }

function load(): Preferences {
  try {
    const stored = Storage.getItemSync(KEY)
    return stored ? { ...DEFAULTS, ...JSON.parse(stored) } : DEFAULTS
  } catch {
    return DEFAULTS
  }
}

let current = load()
const listeners = new Set<() => void>()

export const preferences = (): Preferences => current

export function setPreferences(change: Partial<Preferences>) {
  current = { ...current, ...change }
  Storage.setItemSync(KEY, JSON.stringify(current))
  listeners.forEach((listener) => listener())
}

export function usePreferences(): Preferences {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    preferences,
  )
}
