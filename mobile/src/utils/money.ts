import { formatMoney as formatWithDigits } from "@mizan/core/domain/money/format"
import { preferences } from "@/preferences"
import { inDisplayCurrency } from "./display-rates"

export { fromMinorUnits, toMinorUnits } from "@mizan/core/domain/money/format"

/** Household-currency amounts follow the "show amounts in" switch, marked ≈ because they are converted. */
export function formatMoney(minorUnits: number, currency: string, locale: string): string {
  const shown = inDisplayCurrency(minorUnits, currency)
  if (shown) return `≈ ${formatWithDigits(shown.amount, shown.currency, locale, preferences().digitStyle)}`
  return formatWithDigits(minorUnits, currency, locale, preferences().digitStyle)
}
