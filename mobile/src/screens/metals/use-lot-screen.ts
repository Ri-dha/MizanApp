import { router } from "expo-router"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"

import { microsToRate, RATE_SCALE, rateToMicros } from "@mizan/core/db/income"
import { createLot, perGramFor, removeLot, updateLot } from "@mizan/core/db/metals"
import { defaultsOf, livePrivacySetting } from "@mizan/core/db/privacy"
import { todayIso } from "@mizan/core/domain/calendar/month"
import { PURITIES, toMilligrams, valueOf } from "@mizan/core/domain/metal/valuation"
import { inBase } from "@mizan/core/market/currency"
import type { Metal, MetalForm, WeightUnit } from "@mizan/core/schema"
import { table } from "@mizan/core/store/store"
import { useLiveQuery, useSession } from "@/hooks/use-core"
import { useTodayRate } from "@/hooks/use-currency"
import { useMetals } from "@/hooks/use-views"
import { formatMoney, fromMinorUnits, toMinorUnits } from "@/utils/money"
import { UNITS, wholeFromMicros } from "./format"

const METALS: Metal[] = ["GOLD", "SILVER"]
const FORMS: MetalForm[] = ["JEWELLERY", "COIN", "BAR", "SCRAP"]
const DEFAULT_PURITY: Record<Metal, string> = { GOLD: "21k", SILVER: "999" }

/** Everything the purchase sheet knows and does; the views only draw it. */
export function useLotScreen(id?: string) {
  const { t, i18n } = useTranslation()
  const session = useSession()
  const base = session?.baseCurrency ?? "IQD"
  const lot = useLiveQuery(() => (id ? table("metalLots").get(id) : Promise.resolve(undefined)), [id], undefined)
  const privacy = useLiveQuery(async () => defaultsOf(await livePrivacySetting()), [], defaultsOf(undefined))
  const market = useMetals()
  const [metal, setMetal] = useState<Metal>("GOLD")
  const [purity, setPurity] = useState(DEFAULT_PURITY.GOLD)
  const [quantity, setQuantity] = useState("1")
  const [unit, setUnit] = useState<WeightUnit>("MITHQAL")
  const [purchaseDate, setPurchaseDate] = useState(todayIso())
  const [metalCost, setMetalCost] = useState("")
  const [making, setMaking] = useState("")
  const [fees, setFees] = useState("")
  const [currency, setCurrency] = useState(base)
  const [rate, setRate] = useState("1")
  const todayRate = useTodayRate(base)
  const [form, setForm] = useState<MetalForm>("JEWELLERY")
  const [dealer, setDealer] = useState("")
  const [location, setLocation] = useState("")
  const [serial, setSerial] = useState("")
  const [heldFor, setHeldFor] = useState("")
  const [isPrivate, setIsPrivate] = useState(false)
  const [costTouched, setCostTouched] = useState(!!id)
  const [loaded, setLoaded] = useState(!id)

  useEffect(() => {
    if (!lot || loaded) return
    setMetal(lot.metal)
    setPurity(lot.purityLabel)
    setQuantity(lot.quantityEntered)
    setUnit(lot.weightUnitEntered)
    setPurchaseDate(lot.purchaseDate)
    setMetalCost(fromMinorUnits(lot.metalCost, lot.currency))
    setMaking(fromMinorUnits(lot.makingCharge, lot.currency))
    setFees(fromMinorUnits(lot.fees, lot.currency))
    setCurrency(lot.currency)
    setRate(microsToRate(lot.fxRateMicros, lot.currency, base))
    setForm(lot.form)
    setDealer(lot.dealer ?? "")
    setLocation(lot.location ?? "")
    setSerial(lot.serial ?? "")
    setHeldFor(lot.heldFor ?? "")
    setIsPrivate(lot.visibility === "PRIVATE")
    setLoaded(true)
  }, [lot, loaded])

  useEffect(() => {
    if (!id) setIsPrivate(privacy.metals === "PRIVATE")
  }, [id, privacy.metals])

  const weightMg = toMilligrams(Number(quantity) || 0, unit)
  const needsRate = currency !== base
  const perGramMicros = perGramFor(metal, PURITIES[purity]?.basisPoints ?? 0, market.prices, market.setting)
  const todayBase = valueOf(perGramMicros, weightMg)
  const todayInCurrency = inBase(todayBase, base, currency, market.prices.perUsd) ?? 0
  const hasPrice = perGramMicros > 0 && weightMg > 0

  useEffect(() => {
    if (id || costTouched || !hasPrice) return
    setMetalCost(fromMinorUnits(todayInCurrency, currency))
  }, [id, costTouched, hasPrice, todayInCurrency, currency])

  async function save() {
    const input = {
      metal,
      purityLabel: purity,
      purityBasisPoints: PURITIES[purity].basisPoints,
      weightMg,
      weightUnitEntered: unit,
      quantityEntered: quantity,
      purchaseDate,
      metalCost: toMinorUnits(metalCost || "0", currency),
      makingCharge: toMinorUnits(making || "0", currency),
      fees: toMinorUnits(fees || "0", currency),
      currency,
      fxRateMicros: needsRate ? rateToMicros(rate, currency, base) : RATE_SCALE,
      form,
      dealer: dealer.trim() || null,
      location: location.trim() || null,
      serial: serial.trim() || null,
      heldFor: heldFor.trim() || null,
      note: null,
      visibility: isPrivate ? ("PRIVATE" as const) : ("SHARED" as const),
    }
    if (id) await updateLot(id, input)
    else await createLot(input)
    router.back()
  }

  async function remove() {
    if (!id) return
    await removeLot(id)
    router.back()
  }

  return {
    editing: !!id,
    ready: weightMg > 0,
    save: () => void save(),
    remove: () => void remove(),
    metalNames: METALS.map((m) => t(`metals.metal.${m}`)),
    metalIndex: METALS.indexOf(metal),
    chooseMetal: (index: number) => {
      const next = METALS[index]
      setMetal(next)
      setPurity(DEFAULT_PURITY[next])
    },
    purityOptions: Object.values(PURITIES).filter((p) => p.metal === metal).map((p) => ({ value: p.label, label: `${p.label} (${p.basisPoints / 100}%)` })),
    purity,
    setPurity: (next: string | null) => { if (next) setPurity(next) },
    quantity,
    setQuantity,
    unitOptions: UNITS.map((u) => ({ value: u as string, label: t(`metals.units.${u}`) })),
    unit: unit as string,
    setUnit: (next: string | null) => { if (next) setUnit(next as WeightUnit) },
    inGrams: t("metals.inGrams", { grams: (weightMg / 1000).toFixed(3) }),
    formOptions: FORMS.map((f) => ({ value: f as string, label: t(`metals.forms.${f}`) })),
    form: form as string,
    setForm: (next: string | null) => { if (next) setForm(next as MetalForm) },
    purchaseDate,
    setPurchaseDate: (iso: string | null) => { if (iso) setPurchaseDate(iso) },
    metalCost,
    setMetalCost: (value: string) => { setCostTouched(true); setMetalCost(value) },
    currency,
    pickCurrency: (code: string) => { setCurrency(code); setRate(todayRate(code)) },
    todayHint: hasPrice ? t("metals.todayHint", { perGram: formatMoney(wholeFromMicros(perGramMicros), base, i18n.language), total: formatMoney(todayInCurrency, currency, i18n.language) }) : null,
    canUseToday: hasPrice && costTouched,
    useToday: () => { setMetalCost(fromMinorUnits(todayInCurrency, currency)); setCostTouched(false) },
    rateLabel: needsRate ? t("income.fxRate", { from: currency, to: base }) : null,
    rate,
    setRate,
    making,
    setMaking,
    fees,
    setFees,
    dealer,
    setDealer,
    location,
    setLocation,
    serial,
    setSerial,
    heldFor,
    setHeldFor,
    isPrivate,
    setIsPrivate,
  }
}

export type LotScreenModel = ReturnType<typeof useLotScreen>
