import { formatDate } from "@mizan/core/domain/calendar/hijri"
import { formatDateTime, formatNumber } from "@mizan/core/domain/digits"
import { preferences } from "@/preferences"

/** Local calendar dates as the ISO day strings core stores, without the UTC shift `toISOString` would add. */
export const isoOf = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`

export function dateOf(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number)
  return new Date(year, month - 1, day)
}

export const SHORT_DATE: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" }

/** A Gregorian date, with the Hijri one beside it when this device asks for it (FR-SET-04). */
export function formatDay(iso: string, locale: string, options?: Intl.DateTimeFormatOptions): string {
  return formatDate(iso, locale, preferences().showHijri, options, preferences().digitStyle)
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
