import { viewFor } from "@mizan/core/domain/appStyle"
import { useAppStyle } from "@/theme"
import { useWorldRatesCard } from "./use-world-rates"
import { WorldRatesSoft } from "./views/world-rates-soft"

/** ADR styles-1: each template draws the card its own way; a template without a view of its own gets Soft. */
const VIEWS = { soft: WorldRatesSoft }

export function WorldRates() {
  const model = useWorldRatesCard()
  const View = viewFor(VIEWS, useAppStyle())
  return <View model={model} />
}
