import { useState } from "react"
import { useTranslation } from "react-i18next"

import { perGramFor } from "@mizan/core/db/metals"
import { formatHijri } from "@mizan/core/domain/calendar/hijri"
import { todayIso } from "@mizan/core/domain/calendar/month"
import { valueOf } from "@mizan/core/domain/metal/valuation"
import type { Metal } from "@mizan/core/schema"
import { useSession } from "@/hooks/use-core"
import { useMetals } from "@/hooks/use-views"
import { SHORT_DATE, formatDay } from "@/utils/dates"
import { formatMoney } from "@/utils/money"
import { grams, wholeFromMicros } from "./format"

/** Classical nisab: 20 mithqal of gold (85 g) or 200 dirhams of silver (595 g); both editable. */
const DEFAULT_NISAB_G: Record<Metal, string> = { GOLD: "85", SILVER: "595" }
const ZAKAT_RATE_BP = 250
const BP = 10_000
const MG = 1000
const PURE = 9990
const METALS: Metal[] = ["GOLD", "SILVER"]

/** FR-MTL-12: the base and the inputs only; the screen says so in its first line and makes no ruling. */
export function useZakatScreen() {
  const { t, i18n } = useTranslation()
  const session = useSession()
  const currency = session?.baseCurrency ?? "IQD"
  const view = useMetals()
  const [asOf, setAsOf] = useState(todayIso())
  const [nisab, setNisab] = useState(DEFAULT_NISAB_G)
  const [prices, setPrices] = useState<Record<Metal, string>>({ GOLD: "", SILVER: "" })
  const money = (v: number) => formatMoney(v, currency, i18n.language)
  const perGram24k = (metal: Metal) => perGramFor(metal, PURE, view.prices, view.setting)

  return {
    asOf,
    setAsOf: (iso: string | null) => { if (iso) setAsOf(iso) },
    hijri: formatHijri(asOf, i18n.language),
    metals: METALS.map((metal) => {
      const name = t(`metals.metal.${metal}`)
      const held = view.valued.filter((v) => v.lot.metal === metal && v.remainingMg > 0 && v.lot.purchaseDate <= asOf)
      const pureMg = held.reduce((sum, v) => sum + Math.round((v.remainingMg * v.lot.purityBasisPoints) / BP), 0)
      const perGramMicros = prices[metal].trim() ? Math.round(Number(prices[metal]) * 1_000_000) : perGram24k(metal)
      const value = valueOf(perGramMicros, pureMg)
      const nisabMg = Math.round(Number(nisab[metal]) * MG)
      const reaches = nisabMg > 0 && pureMg >= nisabMg
      return {
        metal,
        name,
        nisabLabel: t("zakat.nisab", { metal: name }),
        nisab: nisab[metal],
        setNisab: (text: string) => setNisab({ ...nisab, [metal]: text }),
        priceLabel: t("zakat.price", { metal: name }),
        price: prices[metal],
        setPrice: (text: string) => setPrices({ ...prices, [metal]: text }),
        priceHint: t("zakat.priceHint", { price: money(wholeFromMicros(perGram24k(metal))) }),
        pureWeight: t("zakat.pureWeight", { weight: grams(pureMg, i18n.language) }),
        value: t("zakat.value", { value: money(value), date: formatDay(asOf, i18n.language, SHORT_DATE) }),
        reaches,
        verdict: reaches ? t("zakat.reaches") : t("zakat.below"),
        base: reaches ? t("zakat.base", { amount: money(Math.round((value * ZAKAT_RATE_BP) / BP)) }) : null,
      }
    }),
  }
}

export type ZakatScreenModel = ReturnType<typeof useZakatScreen>
