import { router } from "expo-router"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import { MILLIGRAMS_PER_UNIT, PURITIES } from "@mizan/core/domain/metal/valuation"
import { setOverride } from "@mizan/core/market/prices"
import type { MarketInstrument } from "@mizan/core/schema"
import { useSession } from "@/hooks/use-core"
import { useMetals } from "@/hooks/use-views"
import { formatCount } from "@/utils/dates"
import { wholeFromMicros } from "./format"

const INSTRUMENTS: MarketInstrument[] = ["XAU", "XAG", "USDIQD"]
const LOCAL_UNITS = ["GRAM", "MITHQAL", "TOLA"]
const PURE_BASIS_POINTS = 10_000
const MG_PER_GRAM = 1000

/** People know the price of a mithqal of 21k, not a gram of pure gold; the hook converts. */
export function useOverrideScreen() {
  const { t, i18n } = useTranslation()
  const session = useSession()
  const base = session?.baseCurrency ?? "IQD"
  const view = useMetals()
  const [instrument, setInstrument] = useState<MarketInstrument>("XAU")
  const [purity, setPurity] = useState("21k")
  const [unit, setUnit] = useState("MITHQAL")
  const [price, setPrice] = useState("")
  const [note, setNote] = useState("")
  const isRate = instrument === "USDIQD"
  const perGram24kMicros = isRate
    ? Math.round(Number(price) * 1e6)
    : Math.round(((Number(price) * 1e6) / (MILLIGRAMS_PER_UNIT[unit] / MG_PER_GRAM)) * (PURE_BASIS_POINTS / PURITIES[purity].basisPoints))
  const instrumentLabel = (i: MarketInstrument) => (i === "XAU" ? t("metals.metal.GOLD") : i === "XAG" ? t("metals.metal.SILVER") : `USD → ${base}`)

  async function save() {
    await setOverride(instrument, perGram24kMicros, note.trim() || null)
    router.back()
  }

  return {
    ready: !!price,
    save: () => void save(),
    instrumentOptions: INSTRUMENTS.map((i) => ({ value: i as string, label: instrumentLabel(i) })),
    instrument: instrument as string,
    setInstrument: (next: string | null) => {
      if (!next) return
      setInstrument(next as MarketInstrument)
      setPurity(next === "XAG" ? "999" : "21k")
    },
    isRate,
    purityOptions: Object.values(PURITIES).filter((p) => p.metal === (instrument === "XAG" ? "SILVER" : "GOLD")).map((p) => ({ value: p.label, label: p.label })),
    purity,
    setPurity: (next: string | null) => { if (next) setPurity(next) },
    unitOptions: LOCAL_UNITS.map((u) => ({ value: u, label: t(`metals.units.${u}`) })),
    unit,
    setUnit: (next: string | null) => { if (next) setUnit(next) },
    priceLabel: isRate ? t("metals.ratePrice", { base }) : t("metals.localPrice", { base }),
    price,
    setPrice,
    perGram: isRate || !price ? null : t("metals.perGram24k", { amount: formatCount(wholeFromMicros(perGram24kMicros), i18n.language) }),
    note,
    setNote,
    overrideCount: view.overrides.length > 0 ? t("metals.overrideCount", { count: view.overrides.length }) : null,
  }
}

export type OverrideScreenModel = ReturnType<typeof useOverrideScreen>
