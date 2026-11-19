import type { WeightUnit } from "@mizan/core/schema"

export const UNITS: WeightUnit[] = ["GRAM", "MITHQAL", "TOLA", "TROY_OUNCE", "KILOGRAM"]

const MG_PER_GRAM = 1000
const MICROS = 1e6

export function grams(mg: number, locale: string): string {
  return `${new Intl.NumberFormat(locale === "ar" ? "ar-IQ-u-nu-latn" : "en-GB", { maximumFractionDigits: 3 }).format(mg / MG_PER_GRAM)} g`
}

export const wholeFromMicros = (micros: number) => Math.round(micros / MICROS)
