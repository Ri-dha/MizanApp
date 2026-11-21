import { formatWhen } from "./dates"

/** The household month as a title: "November 2026", "تشرين الثاني 2026" (or with Arabic-Indic digits, as chosen). */
export function formatMonthKey(key: string, locale: string): string {
  const [year, month] = key.split("-").map(Number)
  return formatWhen(Date.UTC(year, month - 1, 1), locale, { month: "long", year: "numeric", timeZone: "UTC" })
}
