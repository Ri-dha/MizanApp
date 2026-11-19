import type { Href } from "expo-router"

import { pagesIn, parseManual, type ManualPage } from "@mizan/core/help/manual"
import { MANUAL } from "@/help/manual.generated"

const PAGES = parseManual(MANUAL)

export const manualPages = (language: string): ManualPage[] => pagesIn(PAGES, language.startsWith("ar") ? "ar" : "en")

/** The manual names web paths; these are the phone screens they correspond to. */
const PHONE_SCREENS: Record<string, Href> = {
  "/": "/", "/transactions": "/ledger", "/plan": "/plan", "/goals": "/goals", "/debts": "/debts", "/bills": "/bills",
  "/income": "/income", "/metals": "/metals", "/networth": "/networth", "/accounts": "/accounts", "/assets": "/assets",
  "/report": "/report", "/household": "/household", "/sync": "/sync",
}

export const phoneScreenFor = (webPath: string | null): Href | null => (webPath ? PHONE_SCREENS[webPath] ?? null : null)
