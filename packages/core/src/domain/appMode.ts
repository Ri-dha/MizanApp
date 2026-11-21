/** ADR mode-1: what a person sees. Nothing is stored differently; simple only hides screens. */
export type AppMode = "simple" | "advanced"

export const APP_MODES: readonly AppMode[] = ["simple", "advanced"]

/** The parts of the app simple mode leaves out. Everything not listed here shows in both modes. */
export type AdvancedArea = "plan" | "bills" | "income" | "goals" | "metals" | "assets" | "networth" | "household" | "yearReport"

export const isAppMode = (value: unknown): value is AppMode => value === "simple" || value === "advanced"

/** Whether a screen, card or field belonging to an area shows; no area means it always does. */
export const shows = (mode: AppMode, area: AdvancedArea | undefined): boolean => mode === "advanced" || area === undefined
