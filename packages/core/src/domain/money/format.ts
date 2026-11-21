import { withDigits, type DigitStyle } from "../digits"

export type { DigitStyle } from "../digits"

/** The dinar is counted in whole dinars (FR-SET-03), whatever ISO says; every other currency follows its own minor unit. */
const FIXED_DIGITS: Readonly<Record<string, number>> = { IQD: 0 }
const digitsCache = new Map<string, number>()

export function fractionDigits(currency: string): number {
  const fixed = FIXED_DIGITS[currency]
  if (fixed !== undefined) return fixed
  let digits = digitsCache.get(currency)
  if (digits === undefined) {
    try {
      digits = new Intl.NumberFormat("en", { style: "currency", currency }).resolvedOptions().maximumFractionDigits ?? 2
    } catch {
      digits = 2
    }
    digitsCache.set(currency, digits)
  }
  return digits
}

/** How many minor units make one unit: 1 for the dinar and the yen, 100 for cents, 1000 for fils. */
export function minorUnitsPerMajor(currency: string): number {
  return 10 ** fractionDigits(currency)
}

export function formatMoney(minorUnits: number, currency: string, locale: string, digits: DigitStyle = "western"): string {
  const places = fractionDigits(currency)
  const text = new Intl.NumberFormat(locale === "ar" ? "ar-IQ" : "en-IQ", {
    style: "currency",
    currency,
    currencyDisplay: "code",
    maximumFractionDigits: places,
    minimumFractionDigits: places,
  }).format(minorUnits / 10 ** places)
  return locale === "ar" ? withDigits(text, digits) : text
}

export function toMinorUnits(input: string, currency: string): number {
  const cleaned = input.replace(/[^\d.-]/g, "")
  const value = Number(cleaned)
  if (Number.isNaN(value)) return 0
  return Math.round(value * minorUnitsPerMajor(currency))
}

export function fromMinorUnits(minorUnits: number, currency: string): string {
  const places = fractionDigits(currency)
  return places === 0 ? String(minorUnits) : (minorUnits / 10 ** places).toFixed(places)
}
