import { router } from "expo-router"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"

import { RATE_SCALE, toBaseAmount } from "@mizan/core/db/income"
import { recordSale } from "@mizan/core/db/metals"
import { todayIso } from "@mizan/core/domain/calendar/month"
import { InsufficientWeightError, planDisposal } from "@mizan/core/domain/metal/disposal"
import { toMilligrams } from "@mizan/core/domain/metal/valuation"
import type { DisposalMethod, Metal, WeightUnit } from "@mizan/core/schema"
import { useSession } from "@/hooks/use-core"
import { useMetals } from "@/hooks/use-views"
import { formatMoney, toMinorUnits } from "@/utils/money"
import { UNITS } from "./format"

const METHODS: DisposalMethod[] = ["FIFO", "SPECIFIC", "WEIGHTED_AVERAGE"]

/** Everything the sale sheet knows and does; the views only draw it. */
export function useSellScreen(metal: Metal) {
  const { t, i18n } = useTranslation()
  const session = useSession()
  const base = session?.baseCurrency ?? "IQD"
  const view = useMetals()
  const [quantity, setQuantity] = useState("1")
  const [unit, setUnit] = useState<WeightUnit>("MITHQAL")
  const [proceeds, setProceeds] = useState("")
  const [fees, setFees] = useState("")
  const [soldOn, setSoldOn] = useState(todayIso())
  const [method, setMethod] = useState<DisposalMethod | null>(null)
  const [chosen, setChosen] = useState<string[]>([])
  const [buyer, setBuyer] = useState("")
  const [error, setError] = useState<string | null>(null)
  const preferred = (metal === "GOLD" ? view.setting?.goldMethod : view.setting?.silverMethod) ?? "FIFO"
  const activeMethod = method ?? preferred

  useEffect(() => setError(null), [quantity, unit, proceeds, activeMethod, chosen])

  const money = (v: number) => formatMoney(v, base, i18n.language)
  const signed = (v: number) => (v > 0 ? "+" : "") + money(v)
  const candidates = view.valued.filter((v) => v.lot.metal === metal && v.remainingMg > 0)
  const weightMg = toMilligrams(Number(quantity) || 0, unit)
  const proceedsBase = toBaseAmount(toMinorUnits(proceeds || "0", base) - toMinorUnits(fees || "0", base), RATE_SCALE)
  let preview: ReturnType<typeof planDisposal> | null = null
  let previewError: string | null = null
  try {
    preview = planDisposal(
      candidates.map((v) => ({ id: v.lot.id, purchaseDate: v.lot.purchaseDate, weightMg: v.lot.weightMg, remainingMg: v.remainingMg, metalCost: v.metalCostBase, makingCharge: v.makingBase, fees: v.feesBase })),
      weightMg, activeMethod, chosen, proceedsBase,
    )
  } catch (e) {
    previewError = e instanceof InsufficientWeightError ? t("metals.notEnough") : String(e)
  }

  async function save() {
    try {
      await recordSale(view.valued, {
        metal, weightMg, proceeds: toMinorUnits(proceeds || "0", base), fees: toMinorUnits(fees || "0", base), currency: base, fxRateMicros: RATE_SCALE,
        soldOn, method: activeMethod, specificLotIds: chosen, buyer: buyer.trim() || null, note: null,
      })
      router.back()
    } catch (e) {
      setError(e instanceof InsufficientWeightError ? t("metals.notEnough") : String(e))
    }
  }

  return {
    title: t("metals.sell", { metal: t(`metals.metal.${metal}`) }),
    ready: !!preview && !!proceeds,
    save: () => void save(),
    error,
    quantity,
    setQuantity,
    unitOptions: UNITS.map((u) => ({ value: u as string, label: t(`metals.units.${u}`) })),
    unit: unit as string,
    setUnit: (next: string | null) => { if (next) setUnit(next as WeightUnit) },
    proceeds,
    setProceeds,
    fees,
    setFees,
    soldOn,
    setSoldOn: (iso: string | null) => { if (iso) setSoldOn(iso) },
    buyer,
    setBuyer,
    methodOptions: METHODS.map((m) => ({ value: m as string, label: t(`metals.methods.${m}`) })),
    method: activeMethod as string,
    setMethod: (next: string | null) => { if (next) setMethod(next as DisposalMethod) },
    /** Only when the person picks the lots themselves. */
    lots: activeMethod === "SPECIFIC"
      ? candidates.map((v) => ({
          id: v.lot.id,
          label: `${v.lot.purchaseDate} · ${v.lot.purityLabel} · ${(v.remainingMg / 1000).toFixed(3)} g · ${money(v.costPerGramBase)}/g`,
          chosen: chosen.includes(v.lot.id),
          toggle: (on: boolean) => setChosen(on ? [...chosen, v.lot.id] : chosen.filter((lotId) => lotId !== v.lot.id)),
        }))
      : null,
    previewError,
    preview: preview
      ? {
          cost: t("metals.costLeaving", { amount: money(preview.costBasis) }),
          realised: t("metals.realised", { amount: signed(preview.realisedGain) }),
          negative: preview.realisedGain < 0,
          excludingMaking: t("metals.excludingMaking", { amount: signed(preview.realisedGainExcludingMaking) }),
        }
      : null,
  }
}

export type SellScreenModel = ReturnType<typeof useSellScreen>
