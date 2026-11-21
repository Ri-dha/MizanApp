import { withDigits, type DigitStyle } from "../digits"

/** FR-SET-04: the Umm al-Qura calendar alongside Gregorian; Intl does the arithmetic. */
export function formatHijri(iso: string, locale: string, options: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" }, digits: DigitStyle = "western"): string {
  const [y, m, d] = iso.split("-").map(Number)
  const tag = `${locale === "ar" ? "ar-SA" : "en-GB"}-u-ca-islamic-umalqura`
  try {
    const text = new Intl.DateTimeFormat(tag, { ...options, timeZone: "UTC" }).format(new Date(Date.UTC(y, m - 1, d)))
    return locale === "ar" ? withDigits(text, digits) : text
  } catch {
    return ""
  }
}

export function formatGregorian(iso: string, locale: string, options: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" }, digits: DigitStyle = "western"): string {
  const [y, m, d] = iso.split("-").map(Number)
  const text = new Intl.DateTimeFormat(locale === "ar" ? "ar-IQ" : "en-GB", { ...options, timeZone: "UTC" }).format(new Date(Date.UTC(y, m - 1, d)))
  return locale === "ar" ? withDigits(text, digits) : text
}

/** "13 Sept 2026 · 1 Rabiʻ II 1448" when Hijri is on, the Gregorian date alone otherwise. */
export function formatDate(iso: string, locale: string, withHijri: boolean, options?: Intl.DateTimeFormatOptions, digits: DigitStyle = "western"): string {
  const gregorian = formatGregorian(iso, locale, options, digits)
  if (!withHijri) return gregorian
  const hijri = formatHijri(iso, locale, undefined, digits)
  return hijri ? `${gregorian} · ${hijri}` : gregorian
}
