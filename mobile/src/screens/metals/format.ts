import type { WeightUnit } from "@mizan/core/schema"
import { formatCount } from "@/utils/dates"

export const UNITS: WeightUnit[] = ["GRAM", "MITHQAL", "TOLA", "TROY_OUNCE", "KILOGRAM"]

const MG_PER_GRAM = 1000
const MICROS = 1e6

export function grams(mg: number, locale: string): string {
  return `${formatCount(mg / MG_PER_GRAM, locale, { maximumFractionDigits: 3 })} g`
}

export const wholeFromMicros = (micros: number) => Math.round(micros / MICROS)
