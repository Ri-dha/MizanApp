import { useSyncExternalStore } from "react"

import { saveSyncedPreferences } from "@mizan/core/db/homeLayout"

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
}


const KEY = "mizan.preferences"
export const DEFAULTS: Preferences = {
  digitStyle: "western",
  showUsd: false,
  toursSeen: [],
  valuationReminderMonths: 6,
  showHijri: false,
  displayCurrency: null,
}

let current: Preferences = load()
const listeners = new Set<() => void>()

function load(): Preferences {
  try {
    const stored = localStorage.getItem(KEY)
    return stored ? { ...DEFAULTS, ...JSON.parse(stored) } : DEFAULTS
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

export function usePreferences(): Preferences {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    () => current,
  )
}
