import type { MetalsView } from "@mizan/core/db/metalsView"
import { viewFor } from "@mizan/core/domain/appStyle"
import { useAppStyle } from "@/theme"
import { useSellOrHold } from "./use-sell-or-hold"
import { SellOrHoldSoft } from "./views/sell-or-hold-soft"

/** ADR styles-1: each template draws the card its own way; a template without a view of its own gets Soft. */
const VIEWS = { soft: SellOrHoldSoft }

export function SellOrHold({ view, currency }: { view: MetalsView; currency: string }) {
  const model = useSellOrHold(view, currency)
  const View = viewFor(VIEWS, useAppStyle())
  return <View model={model} />
}
