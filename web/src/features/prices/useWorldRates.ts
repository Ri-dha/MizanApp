import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { useSession } from "@/api/auth"
import { describeError } from "@/app/errors"
import { usePreferences } from "@/app/preferences"
import { useCurrencyName } from "@/features/currency/useCurrencies"
import { useMetals } from "@/features/metals/useMetals"
import { useWorldHistory, useWorldRates } from "@/market/world"
import { updateProfile } from "@mizan/core/auth/profile"
import { formatDateTime, formatNumber } from "@mizan/core/domain/digits"
import { trackedCurrencies, unitRate } from "@mizan/core/market/currency"

/** Rates run from 0.0003 dinars (the rial) to 4,800 (the Kuwaiti dinar): keep four significant digits below one. */
function rateOptions(value: number): Intl.NumberFormatOptions {
  if (value >= 100) return { maximumFractionDigits: 0 }
  if (value >= 1) return { maximumFractionDigits: 2 }
  return { maximumSignificantDigits: 4 }
}

/** T-world-rates: the currencies a person follows in the household's currency, a converter, and a chart for each. */
export function useWorldRatesModel() {
  const { t, i18n } = useTranslation()
  const { digitStyle } = usePreferences()
  const session = useSession()
  const world = useWorldRates()
  const { prices } = useMetals()
  const base = session?.baseCurrency ?? "IQD"
  const followed = useMemo(() => trackedCurrencies(session), [session])
  const [amount, setAmount] = useState("100")
  const [from, setFrom] = useState<string | null>(null)
  const [to, setTo] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const [showAll, setShowAll] = useState(false)
  const [picked, setPicked] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const names = useCurrencyName()

  const fromCode = from ?? followed[0] ?? "USD"
  const toCode = to ?? base
  const charted = picked ?? (followed.find((c) => c !== "USD") ?? "EUR")
  const history = useWorldHistory(charted === "USD" ? "EUR" : charted)

  const locale = i18n.language
  const number = (value: number, options: Intl.NumberFormatOptions = {}) => formatNumber(value, locale, options, digitStyle)
  const rate = (value: number) => number(value, rateOptions(value))
  const date = (iso: string, options: Intl.DateTimeFormatOptions) => formatDateTime(iso, locale, options, digitStyle)

  const perUsd = prices.perUsd
  const codes = useMemo(() => Object.keys(perUsd), [perUsd])
  const latestDay = world?.rates.reduce((latest, r) => (r.day > latest ? r.day : latest), "")

  const typed = Number(amount.replace(/[^\d.]/g, ""))
  const factor = unitRate(fromCode, toCode, perUsd)
  const result = Number.isFinite(typed) && factor !== null ? typed * factor : null

  const listed = useMemo(() => {
    const needle = query.trim().toLowerCase()
    const all = codes.filter((c) => c !== base)
    const matches = needle
      ? all.filter((c) => c.toLowerCase().includes(needle) || names(c).toLowerCase().includes(needle))
      : showAll ? all : followed.filter((c) => perUsd[c])
    const rank = (code: string) => {
      const at = followed.indexOf(code)
      return at === -1 ? followed.length : at
    }
    return [...matches].sort((a, b) => rank(a) - rank(b) || names(a).localeCompare(names(b), locale))
  }, [codes, base, query, showAll, followed, perUsd, names, locale])

  async function toggleFollow(code: string) {
    const next = followed.includes(code) ? followed.filter((c) => c !== code) : [...followed, code]
    setSaving(true)
    try {
      await updateProfile({ trackedCurrencies: next })
    } catch (e) {
      toast.error(describeError(e))
    } finally {
      setSaving(false)
    }
  }

  const dinarNote = base === "IQD" || toCode === "IQD" || fromCode === "IQD"
  return {
    available: Boolean(world && world.rates.length > 0),
    base,
    codes,
    names,
    number,
    rate,
    date,
    amount, setAmount,
    fromCode, setFrom,
    toCode, setTo,
    swap: () => { setFrom(toCode); setTo(fromCode) },
    typed,
    result,
    latestDay,
    charted,
    history,
    query, setQuery,
    showAll, setShowAll,
    listed: listed.map((code) => ({ code, name: names(code), inBase: unitRate(code, base, perUsd), perDollar: perUsd[code], following: followed.includes(code) })),
    saving,
    toggleFollow,
    pick: (code: string) => { setPicked(code); setFrom(code); setTo(base) },
    intro: t("worldRates.body", { count: codes.length }),
    dinarLine: !dinarNote ? null : prices.usdIqdMicros > 0
      ? t(prices.rateKind === "OFFICIAL" ? "worldRates.dinarOfficial" : "worldRates.dinarMarket", { rate: number(prices.usdIqdMicros / 1e6, { maximumFractionDigits: 0 }) })
      : t("worldRates.noDinar"),
  }
}

export type WorldRatesModel = ReturnType<typeof useWorldRatesModel>
