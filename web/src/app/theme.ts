import { useSyncExternalStore } from "react"

import type { AppStyle } from "@mizan/core/domain/appStyle"
import { preferences, subscribePreferences } from "@/app/preferences"

export type Theme = "system" | "light" | "dark"

const STORAGE_KEY = "mizan.theme"
const listeners = new Set<() => void>()

function stored(): Theme {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    return value === "light" || value === "dark" ? value : "system"
  } catch {
    return "system"
  }
}

function prefersDark() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
}

/** The page background of each template (ADR styles-1); `public/theme-boot.js` holds the same values. */
const THEME_COLOR: Record<AppStyle, { light: string; dark: string }> = {
  mizan: { light: "#f3f5f9", dark: "#0b1220" },
  clear: { light: "#f5f5f7", dark: "#000000" },
  soft: { light: "#f1f6f8", dark: "#101518" },
}
let followingDevice = false

function apply() {
  const theme = stored()
  const style = preferences().appStyle
  const dark = theme === "dark" || (theme === "system" && prefersDark())
  document.documentElement.classList.toggle("dark", dark)
  document.documentElement.dataset.style = style
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", dark ? THEME_COLOR[style].dark : THEME_COLOR[style].light)
}

/** `public/theme-boot.js` sets the class before first paint; this keeps it in step with the device. */
export function applyStoredTheme() {
  apply()
  if (followingDevice) return
  followingDevice = true
  let style = preferences().appStyle
  subscribePreferences(() => {
    if (preferences().appStyle === style) return
    style = preferences().appStyle
    apply()
  })
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    if (stored() === "system") apply()
  })
}

export function setTheme(theme: Theme) {
  try {
    localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    // Storage may be unavailable; the choice then lasts for this visit only.
  }
  apply()
  listeners.forEach((listener) => listener())
}

export function useTheme(): Theme {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    stored,
  )
}

export function resolvedTheme(): "light" | "dark" {
  return document.documentElement.classList.contains("dark") ? "dark" : "light"
}
