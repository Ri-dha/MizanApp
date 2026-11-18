export type DigitStyle = "western" | "eastern"

const ZERO_DECIMAL_CURRENCIES: ReadonlySet<string> = new Set(["IQD"])

/** How many minor units make one unit: 1 for the dinar, 100 for currencies with cents. */
export function minorUnitsPerMajor(currency: string): number {
  return ZERO_DECIMAL_CURRENCIES.has(currency) ? 1 : 100
}

/** IQD shows whole dinars with grouping (FR-SET-03); other currencies use their own minor unit. */
const ARABIC_INDIC: Record<string, string> = {
  "٠": "0", "١": "1", "٢": "2", "٣": "3", "٤": "4", "٥": "5", "٦": "6", "٧": "7", "٨": "8", "٩": "9", "٬": ",", "٫": ".",
}

/** Hermes (React Native) ignores the -u-nu-latn hint and always answers Arabic with Arabic-Indic digits. */
function westernised(text: string): string {
  return text.replace(/[٠-٩٬٫]/g, (c) => ARABIC_INDIC[c] ?? c)
}

export function formatMoney(minorUnits: number, currency: string, locale: string, digits: DigitStyle = "western"): string {
  const zeroDecimal = ZERO_DECIMAL_CURRENCIES.has(currency)
  const amount = zeroDecimal ? minorUnits : minorUnits / 100
  const eastern = digits === "eastern"
  const text = new Intl.NumberFormat(locale === "ar" ? (eastern ? "ar-IQ-u-nu-arab" : "ar-IQ-u-nu-latn") : "en-IQ", {
    style: "currency",
    currency,
    currencyDisplay: "code",
    maximumFractionDigits: zeroDecimal ? 0 : 2,
    minimumFractionDigits: zeroDecimal ? 0 : 2,
  }).format(amount)
  return eastern ? text : westernised(text)
}

export function toMinorUnits(input: string, currency: string): number {
  const cleaned = input.replace(/[^\d.-]/g, "")
  const value = Number(cleaned)
  if (Number.isNaN(value)) return 0
  return ZERO_DECIMAL_CURRENCIES.has(currency) ? Math.round(value) : Math.round(value * 100)
}

export function fromMinorUnits(minorUnits: number, currency: string): string {
  return ZERO_DECIMAL_CURRENCIES.has(currency) ? String(minorUnits) : (minorUnits / 100).toFixed(2)
}
