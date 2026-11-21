import { useTranslation } from "react-i18next"

import { preferences, usePreferences } from "./preferences"
import { formatDate } from "@mizan/core/domain/calendar/hijri"
import { formatDateTime, formatNumber } from "@mizan/core/domain/digits"

/** One place for the app's date rendering so the Hijri preference applies everywhere. */
export function useDateFormat() {
  const { i18n } = useTranslation()
  const prefs = usePreferences()
  return (iso: string, options?: Intl.DateTimeFormatOptions) => formatDate(iso, i18n.language, prefs.showHijri, options, prefs.digitStyle)
}

export const DATE: Intl.DateTimeFormatOptions = { dateStyle: "medium" }
export const DATE_TIME: Intl.DateTimeFormatOptions = { dateStyle: "medium", timeStyle: "short" }

/** A moment (a sync, an upload, a message) in the app's language, with the digits this device chose. */
export function formatWhen(value: Date | string | number, locale: string, options: Intl.DateTimeFormatOptions = DATE_TIME): string {
  return formatDateTime(value, locale, options, preferences().digitStyle)
}

/** A plain number (grams, a rate) in the app's language, with the digits this device chose. */
export function formatCount(value: number, locale: string, options?: Intl.NumberFormatOptions): string {
  return formatNumber(value, locale, options, preferences().digitStyle)
}
