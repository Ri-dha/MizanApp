import { router } from "expo-router"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"

import { DEFAULT_SETTING, saveSetting } from "@mizan/core/market/prices"
import type { DisposalMethod, Metal, PriceSource, RateKind, ValuationBasis } from "@mizan/core/schema"
import { useSession } from "@/hooks/use-core"
import { useMetals } from "@/hooks/use-views"

const METHODS: DisposalMethod[] = ["FIFO", "SPECIFIC", "WEIGHTED_AVERAGE"]
const RATE_KINDS: RateKind[] = ["PARALLEL", "OFFICIAL"]
const PRICE_SOURCES: PriceSource[] = ["WORLD", "LOCAL"]
const METALS: Metal[] = ["GOLD", "SILVER"]
const BASIS_POINTS_PER_PERCENT = 100

type PerMetal<T> = Record<Metal, T>
const percentOf = (basisPoints: number | undefined) => String((basisPoints ?? 0) / BASIS_POINTS_PER_PERCENT)
const basisPointsOf = (percent: string) => Math.round(Number(percent || "0") * BASIS_POINTS_PER_PERCENT)

/** Everything the price settings sheet knows and does; the views only draw it. */
export function useMarketSettingsScreen() {
  const { t } = useTranslation()
  const { setting } = useMetals()
  const session = useSession()
  const [rateKind, setRateKind] = useState<RateKind>(DEFAULT_SETTING.rateKind)
  const [priceSource, setPriceSource] = useState<PriceSource>("WORLD")
  const [premium, setPremium] = useState<PerMetal<string>>({ GOLD: "0", SILVER: "0" })
  const [method, setMethod] = useState<PerMetal<DisposalMethod>>({ GOLD: "FIFO", SILVER: "FIFO" })
  const [basis, setBasis] = useState<ValuationBasis>("MARKET")
  const [buyback, setBuyback] = useState<PerMetal<string>>({ GOLD: "0", SILVER: "0" })
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (loaded || !setting) return
    setRateKind(setting.rateKind)
    setPriceSource(setting.priceSource ?? "WORLD")
    setPremium({ GOLD: percentOf(setting.goldPremiumBasisPoints), SILVER: percentOf(setting.silverPremiumBasisPoints) })
    setMethod({ GOLD: setting.goldMethod, SILVER: setting.silverMethod })
    setBasis(setting.valuationBasis ?? "MARKET")
    setBuyback({ GOLD: percentOf(setting.goldBuybackBasisPoints), SILVER: percentOf(setting.silverBuybackBasisPoints) })
    setLoaded(true)
  }, [setting, loaded])

  async function save() {
    await saveSetting({
      rateKind,
      goldPremiumBasisPoints: basisPointsOf(premium.GOLD),
      silverPremiumBasisPoints: basisPointsOf(premium.SILVER),
      goldMethod: method.GOLD,
      silverMethod: method.SILVER,
      valuationBasis: basis,
      priceSource,
      goldBuybackBasisPoints: basisPointsOf(buyback.GOLD),
      silverBuybackBasisPoints: basisPointsOf(buyback.SILVER),
    })
    router.back()
  }

  const methodOptions = METHODS.map((m) => ({ value: m as string, label: t(`metals.methods.${m}`) }))
  return {
    save: () => void save(),
    /** The dollar kind and the Baghdad dealer only mean something to a household counting in dinars. */
    dinar: (session?.baseCurrency ?? "IQD") === "IQD",
    rateKindOptions: RATE_KINDS.map((k) => ({ value: k as string, label: t(`metals.rateKinds.${k}`) })),
    rateKind: rateKind as string,
    setRateKind: (next: string | null) => { if (next) setRateKind(next as RateKind) },
    priceSourceOptions: PRICE_SOURCES.map((k) => ({ value: k as string, label: t(`metals.priceSources.${k}`) })),
    priceSource: priceSource as string,
    setPriceSource: (next: string | null) => { if (next) setPriceSource(next as PriceSource) },
    metals: METALS.map((metal) => {
      const name = t(`metals.metal.${metal}`)
      return {
        metal,
        premiumLabel: t("metals.premium", { metal: name }),
        premium: premium[metal],
        setPremium: (value: string) => setPremium({ ...premium, [metal]: value }),
        methodLabel: t("metals.defaultMethod", { metal: name }),
        methodOptions,
        method: method[metal] as string,
        setMethod: (next: string | null) => { if (next) setMethod({ ...method, [metal]: next as DisposalMethod }) },
        buybackLabel: t("metals.buybackSpread", { metal: name }),
        buyback: buyback[metal],
        setBuyback: (value: string) => setBuyback({ ...buyback, [metal]: value }),
      }
    }),
    buybackBasis: basis === "BUYBACK",
    setBuybackBasis: (on: boolean) => setBasis(on ? "BUYBACK" : "MARKET"),
  }
}

export type MarketSettingsModel = ReturnType<typeof useMarketSettingsScreen>
