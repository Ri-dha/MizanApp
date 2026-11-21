export type DigitStyle = "western" | "eastern"

const TO_WESTERN: Record<string, string> = {
  "٠": "0", "١": "1", "٢": "2", "٣": "3", "٤": "4", "٥": "5", "٦": "6", "٧": "7", "٨": "8", "٩": "9", "٬": ",", "٫": ".",
}
const EASTERN = "٠١٢٣٤٥٦٧٨٩"

/**
 * FR-SET-03: Arabic text shows the digits the person chose. The locale's -u-nu- hint cannot carry
 * it: Hermes (React Native) ignores it and answers Arabic with Arabic-Indic digits, and browsers
 * pick by region (ar-IQ is Arabic-Indic). So the digits are set after formatting.
 */
export function withDigits(text: string, digits: DigitStyle): string {
  return digits === "eastern" ? text.replace(/[0-9]/g, (c) => EASTERN[Number(c)]) : text.replace(/[٠-٩٬٫]/g, (c) => TO_WESTERN[c] ?? c)
}

const isArabic = (locale: string) => locale.startsWith("ar")

/** A date or time in the app's language; the digit setting applies to Arabic only. */
export function formatDateTime(value: Date | string | number, locale: string, options: Intl.DateTimeFormatOptions, digits: DigitStyle = "western"): string {
  const text = new Intl.DateTimeFormat(isArabic(locale) ? "ar-IQ" : "en-GB", options).format(new Date(value))
  return isArabic(locale) ? withDigits(text, digits) : text
}

/** A plain number (not money, which has its own format) in the app's language. */
export function formatNumber(value: number, locale: string, options: Intl.NumberFormatOptions = {}, digits: DigitStyle = "western"): string {
  const text = new Intl.NumberFormat(isArabic(locale) ? "ar-IQ" : "en-GB", options).format(value)
  return isArabic(locale) ? withDigits(text, digits) : text
}
