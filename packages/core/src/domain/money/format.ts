import { withDigits, type DigitStyle } from "../digits"

export type { DigitStyle } from "../digits"

const ZERO_DECIMAL_CURRENCIES: ReadonlySet<string> = new Set(["IQD"])

/** How many minor units make one unit: 1 for the dinar, 100 for currencies with cents. */
export function minorUnitsPerMajor(currency: string): number {
  return ZERO_DECIMAL_CURRENCIES.has(currency) ? 1 : 100
}

/** IQD shows whole dinars with grouping (FR-SET-03); other currencies use their own minor unit. */
export function formatMoney(minorUnits: number, currency: string, locale: string, digits: DigitStyle = "western"): string {
  const zeroDecimal = ZERO_DECIMAL_CURRENCIES.has(currency)
  const amount = zeroDecimal ? minorUnits : minorUnits / 100
  const text = new Intl.NumberFormat(locale === "ar" ? "ar-IQ" : "en-IQ", {
    style: "currency",
    currency,
    currencyDisplay: "code",
    maximumFractionDigits: zeroDecimal ? 0 : 2,
    minimumFractionDigits: zeroDecimal ? 0 : 2,
  }).format(amount)
  return locale === "ar" ? withDigits(text, digits) : text
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
