import { formatDate } from "@mizan/core/domain/calendar/hijri"
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
  return formatDate(iso, locale, preferences().showHijri, options)
}
