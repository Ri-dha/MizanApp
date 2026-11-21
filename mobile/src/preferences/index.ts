import { useSyncExternalStore } from "react"
import Storage from "expo-sqlite/kv-store"

import { saveSyncedPreferences } from "@mizan/core/db/homeLayout"
import type { DigitStyle } from "@mizan/core/domain/money/format"
import type { AppMode } from "@mizan/core/domain/appMode"

export type LanguageChoice = "system" | "en" | "ar"
export type ThemeChoice = "system" | "light" | "dark"

/** Read before unlock, so nothing here is sensitive. Digits, the dollar line, Hijri and the valuation reminder also follow the person (ADR home-2); this copy is the device's cache of them. */
export interface Preferences {
  language: LanguageChoice
  theme: ThemeChoice
  digitStyle: DigitStyle
  showUsd: boolean
  showHijri: boolean
  /** FR-AST-04: months after which an asset without a fresh valuation is flagged. */
  valuationReminderMonths: number
  /** Tour ids already shown on this device; deliberately not synced. */
  toursSeen: string[]
  /** Operator notices closed on this device (ADR admin-1). */
  dismissedAnnouncements: string[]
  /** Shows main-currency amounts in another currency at today's rate; nothing stored changes. Null shows them as they are. */
  displayCurrency: string | null
  /** ADR mode-1: simple hides the planning and wealth screens; nothing stored changes. */
  appMode: AppMode
}

const KEY = "mizan.preferences"
export const DEFAULTS: Preferences = { language: "system", theme: "system", digitStyle: "western", showUsd: false, showHijri: false, valuationReminderMonths: 6, toursSeen: [], dismissedAnnouncements: [], displayCurrency: null, appMode: "advanced" }

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

/** Changes this device only; for values that arrived from the person's other devices. */
export function applyLocal(change: Partial<Preferences>) {
  current = { ...current, ...change }
  Storage.setItemSync(KEY, JSON.stringify(current))
  listeners.forEach((listener) => listener())
}

export function setPreferences(change: Partial<Preferences>) {
  applyLocal(change)
  void saveSyncedPreferences(change).catch(() => undefined)
}

/** Re-renders everything that formats with the preferences, e.g. when the rates they depend on arrive. */
export function refreshPreferences() {
  current = { ...current }
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
