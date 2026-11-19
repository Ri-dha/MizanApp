import { formatMoney as formatWithDigits } from "@mizan/core/domain/money/format"
import { preferences } from "@/preferences"

export { fromMinorUnits, toMinorUnits } from "@mizan/core/domain/money/format"

export function formatMoney(minorUnits: number, currency: string, locale: string): string {
  return formatWithDigits(minorUnits, currency, locale, preferences().digitStyle)
}
