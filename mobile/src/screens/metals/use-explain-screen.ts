import { useTranslation } from "react-i18next"

import { premiumFor } from "@mizan/core/db/metals"
import { MICROGRAMS_PER_TROY_OUNCE, PURITIES, metalValuation } from "@mizan/core/domain/metal/valuation"
import { useSession } from "@/hooks/use-core"
import { useMetals } from "@/hooks/use-views"
import { formatMoney } from "@/utils/money"
import { wholeFromMicros } from "./format"

const EXAMPLE_WEIGHT_MG = 5000
const PURE_BASIS_POINTS = 10_000

/** FR-MKT-02: every intermediate of BR-08, with the numbers currently in use. */
export function useExplainScreen() {
  const { t, i18n } = useTranslation()
  const session = useSession()
  const base = session?.baseCurrency ?? "IQD"
  const view = useMetals()
  const gold = view.prices.spot.GOLD
  const premium = premiumFor(view.setting, "GOLD")
  const purity = PURITIES["21k"]
  const result = metalValuation({
    spotUsdPerOzMicros: gold.spotUsdPerOzMicros, usdBaseMicros: view.prices.usdBaseMicros, purityBasisPoints: purity.basisPoints,
    premiumBasisPoints: premium, premiumFixedPerGramMicros: 0, weightMg: EXAMPLE_WEIGHT_MG,
  })
  const money = (micros: number) => formatMoney(wholeFromMicros(micros), base, i18n.language)
  return {
    steps: [
      t("metals.explain.spot", { spot: (gold.spotUsdPerOzMicros / 1e6).toFixed(2), source: gold.source.label }),
      t("metals.explain.rate", { rate: money(view.prices.usdBaseMicros), kind: t(`metals.rateKinds.${view.prices.rateKind}`), source: view.prices.rateSource.label }),
      t("metals.explain.perGram", { ounce: (Number(MICROGRAMS_PER_TROY_OUNCE) / 1e6).toFixed(4), amount: money(result.perGram24kMicros) }),
      t("metals.explain.purity", { purity: purity.label, factor: (purity.basisPoints / PURE_BASIS_POINTS).toFixed(3) }),
      t("metals.explain.premium", { percent: premium / 100, amount: money(result.perGramMicros) }),
    ],
    result: t("metals.explain.mithqal", { amount: formatMoney(result.value, base, i18n.language) }),
    sourceNote: gold.source.kind === "local" ? t("metals.explain.localActive", { source: gold.source.label }) : gold.source.kind === "override" ? t("metals.explain.overrideActive") : null,
  }
}

export type ExplainScreenModel = ReturnType<typeof useExplainScreen>
