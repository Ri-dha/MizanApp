import { viewFor } from "@mizan/core/domain/appStyle"
import { useAppStyle } from "@/theme"
import { useCurrencyScreen } from "./use-currency-screen"
import { CurrencySoft } from "./views/currency-soft"

/** ADR styles-1: each template draws the block its own way; a template without a view of its own gets Soft. */
const VIEWS = { soft: CurrencySoft }

export function CurrencySettings() {
  const model = useCurrencyScreen()
  const View = viewFor(VIEWS, useAppStyle())
  return <View model={model} />
}
