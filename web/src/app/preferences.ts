import { useSyncExternalStore } from "react"

import { saveSyncedPreferences } from "@mizan/core/db/homeLayout"
import type { AppMode } from "@mizan/core/domain/appMode"
import { DEFAULT_APP_STYLE, isAppStyle, type AppStyle } from "@mizan/core/domain/appStyle"

export type DigitStyle = "western" | "eastern"

export interface Preferences {
  digitStyle: DigitStyle
  showUsd: boolean
  /** Tour ids already shown on this device; deliberately not synced. */
  toursSeen: string[]
  /** FR-AST-04: months after which an asset without a fresh valuation is flagged on Home. */
  valuationReminderMonths: number
  /** FR-SET-04: Hijri date alongside the Gregorian one. */
  showHijri: boolean
  /** Shows main-currency amounts in another currency at today's rate; nothing stored changes. Null shows them as they are. */
  displayCurrency: string | null
  /** ADR mode-1: simple hides the planning and wealth screens; nothing stored changes. */
  appMode: AppMode
  /** ADR styles-1: the template; `public/theme-boot.js` reads it from this record before the first paint. */
  appStyle: AppStyle
}


const KEY = "mizan.preferences"
export const DEFAULTS: Preferences = {
  digitStyle: "western",
  showUsd: false,
  toursSeen: [],
  valuationReminderMonths: 6,
  showHijri: false,
  displayCurrency: null,
  // Advanced, so a person from before the choice existed sees no change.
  appMode: "advanced",
  appStyle: DEFAULT_APP_STYLE,
}

let current: Preferences = load()
const listeners = new Set<() => void>()

function load(): Preferences {
  try {
    const stored = localStorage.getItem(KEY)
    if (!stored) return DEFAULTS
    const merged = { ...DEFAULTS, ...JSON.parse(stored) }
    return isAppStyle(merged.appStyle) ? merged : { ...merged, appStyle: DEFAULT_APP_STYLE }
  } catch {
    return DEFAULTS
  }
}

export function preferences(): Preferences {
  return current
}

/** Changes this browser only; for values that arrived from the person's other devices. */
export function applyLocal(patch: Partial<Preferences>) {
  current = { ...current, ...patch }
  try {
    localStorage.setItem(KEY, JSON.stringify(current))
  } catch {
    // Per-device convenience only; losing it costs nothing.
  }
  listeners.forEach((l) => l())
}

/** Re-renders everything that formats with the preferences, e.g. when the rates they depend on arrive. */
export function refreshPreferences() {
  current = { ...current }
  listeners.forEach((l) => l())
}

/** Digits, the dollar line, Hijri and the valuation reminder also go to the person's synced row (ADR home-2). */
export function setPreferences(patch: Partial<Preferences>) {
  applyLocal(patch)
  void saveSyncedPreferences(patch).catch(() => undefined)
}

/** For code outside React that follows a preference, such as the template on the page element. */
export function subscribePreferences(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function usePreferences(): Preferences {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    () => current,
  )
}
