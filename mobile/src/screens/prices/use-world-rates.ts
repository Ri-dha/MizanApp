import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { updateProfile } from "@mizan/core/auth/profile"
import { trackedCurrencies, unitRate } from "@mizan/core/market/currency"
import { useSession } from "@/hooks/use-core"
import { useCurrencyName } from "@/hooks/use-currency"
import { useWorldHistory, useWorldRates } from "@/hooks/use-market"
import { useMetals } from "@/hooks/use-views"
import { DATE, formatCount, formatWhen } from "@/utils/dates"
import { describeError } from "@/utils/errors"

/** Rates run from 0.0003 dinars (the rial) to 4,800 (the Kuwaiti dinar): keep four significant digits below one. */
function rateOptions(value: number): Intl.NumberFormatOptions {
  if (value >= 100) return { maximumFractionDigits: 0 }
  if (value >= 1) return { maximumFractionDigits: 2 }
  return { maximumSignificantDigits: 4 }
}

/** The chart's axis stays in plain digits, like every chart in the app. */
const axisRate = (value: number) => new Intl.NumberFormat("en", rateOptions(value)).format(value)

/** T-world-rates: a converter, the currencies a person follows in the household's currency, and a year's chart for each. */
export function useWorldRatesCard() {
  const { t, i18n } = useTranslation()
  const session = useSession()
  const world = useWorldRates()
  const { prices } = useMetals()
  const names = useCurrencyName()
  const base = session?.baseCurrency ?? "IQD"
  const followed = useMemo(() => trackedCurrencies(session), [session])
  const [amount, setAmount] = useState("100")
  const [from, setFrom] = useState<string | null>(null)
  const [to, setTo] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const [showAll, setShowAll] = useState(false)
  const [picked, setPicked] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const locale = i18n.language
  const perUsd = prices.perUsd
  const codes = useMemo(() => Object.keys(perUsd), [perUsd])
  const fromCode = from ?? followed[0] ?? "USD"
  const toCode = to ?? base
  const charted = picked ?? followed.find((c) => c !== "USD") ?? "EUR"
  const history = useWorldHistory(charted === "USD" ? "EUR" : charted)
  const rate = (value: number) => formatCount(value, locale, rateOptions(value))
  const latestDay = world?.rates.reduce((latest, r) => (r.day > latest ? r.day : latest), "")

  const typed = Number(amount.replace(/[^\d.]/g, ""))
  const factor = unitRate(fromCode, toCode, perUsd)
  const result = Number.isFinite(typed) && factor !== null ? typed * factor : null

  const listed = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase()
    const all = codes.filter((c) => c !== base)
    const matches = needle
      ? all.filter((c) => c.toLowerCase().includes(needle) || names(c).toLocaleLowerCase().includes(needle))
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
    setError(null)
    try {
      await updateProfile({ trackedCurrencies: next })
    } catch (e) {
      setError(describeError(e))
    } finally {
      setSaving(false)
    }
  }

  const dinarNote = base === "IQD" || toCode === "IQD" || fromCode === "IQD"
  const dinar = prices.usdIqdMicros > 0
    ? t(prices.rateKind === "OFFICIAL" ? "worldRates.dinarOfficial" : "worldRates.dinarMarket", { rate: formatCount(prices.usdIqdMicros / 1e6, locale, { maximumFractionDigits: 0 }) })
    : t("worldRates.noDinar")

  return {
    none: !world || world.rates.length === 0,
    body: `${t("worldRates.body", { count: codes.length })}${dinarNote ? ` ${dinar}` : ""}`,
    error,
    codes,
    amount,
    setAmount,
    fromCode,
    setFrom,
    toCode,
    setTo,
    swap: () => { setFrom(toCode); setTo(fromCode) },
    result: result === null ? "—" : `${formatCount(typed, locale, { maximumFractionDigits: 2 })} ${fromCode} = ${rate(result)} ${toCode}`,
    asOf: latestDay ? `${t("worldRates.asOf", { day: formatWhen(latestDay, locale, DATE) })} ${t("metals.dataCredit", { name: "Frankfurter" })}` : null,
    chart: charted !== "USD"
      ? {
          title: t("worldRates.chartTitle", { currency: `${charted} · ${names(charted)}` }),
          /** Shown in place of the chart while there are too few points to draw. */
          waiting: history.points.length < 2 ? (history.loading ? t("common.loading") : t("prices.notEnough")) : null,
          formatY: axisRate,
          labels: history.points.map((p) => formatWhen(p.day, locale, { month: "short", year: "2-digit" })),
          seriesLabel: t("worldRates.perUsd", { currency: charted }),
          values: history.points.map((p) => p.perUsd),
        }
      : null,
    listTitle: query || showAll ? t("worldRates.allTitle") : t("worldRates.followedTitle"),
    query,
    setQuery,
    emptyList: listed.length === 0 ? (query ? t("worldRates.noMatch") : t("worldRates.noneFollowed")) : null,
    saving,
    rows: listed.map((code) => {
      const inBase = unitRate(code, base, perUsd)
      const following = followed.includes(code)
      return {
        code,
        name: names(code),
        inBase: inBase === null ? "—" : `${rate(inBase)} ${base}`,
        perDollar: `${rate(perUsd[code])} ${t("worldRates.perDollar")}`,
        following,
        followLabel: following ? t("worldRates.unfollow", { currency: code }) : t("worldRates.followOne", { currency: code }),
        toggleFollow: () => void toggleFollow(code),
        charted: charted === code,
        pick: () => { setPicked(code); setFrom(code); setTo(base) },
      }
    }),
    showAllTitle: query ? null : showAll ? t("worldRates.showFollowed") : t("worldRates.showAll", { count: codes.length - 1 }),
    toggleShowAll: () => setShowAll((v) => !v),
  }
}

export type WorldRatesModel = ReturnType<typeof useWorldRatesCard>
