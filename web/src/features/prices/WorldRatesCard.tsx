import { ArrowLeftRight, Star } from "lucide-react"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"
import { toast } from "sonner"

import { useSession } from "@/api/auth"
import { describeError } from "@/app/errors"
import { usePreferences } from "@/app/preferences"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CurrencySelect } from "@/features/currency/CurrencySelect"
import { useCurrencyName } from "@/features/currency/useCurrencies"
import { useMetals } from "@/features/metals/useMetals"
import { cn } from "@/lib/utils"
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
export function WorldRatesCard() {
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

  const pick = (code: string) => {
    setPicked(code)
    setFrom(code)
    setTo(base)
  }

  const config = { perUsd: { label: t("worldRates.perUsd", { currency: charted }), color: "var(--chart-2)" } } satisfies ChartConfig

  if (!world || world.rates.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("worldRates.title")}</CardTitle>
          <CardDescription>{t("worldRates.none")}</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const dinarNote = base === "IQD" || toCode === "IQD" || fromCode === "IQD"
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("worldRates.title")}</CardTitle>
        <CardDescription>
          {t("worldRates.body", { count: codes.length })}{" "}
          {dinarNote && (prices.usdIqdMicros > 0
            ? t(prices.rateKind === "OFFICIAL" ? "worldRates.dinarOfficial" : "worldRates.dinarMarket", { rate: number(prices.usdIqdMicros / 1e6, { maximumFractionDigits: 0 }) })
            : t("worldRates.noDinar"))}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <section className="flex flex-col gap-3" aria-label={t("worldRates.convert")}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,10rem)_minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-end">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="world-amount">{t("worldRates.amount")}</Label>
              <Input id="world-amount" inputMode="decimal" dir="ltr" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <div className="flex min-w-0 flex-col gap-1.5">
              <Label htmlFor="world-from">{t("worldRates.from")}</Label>
              <CurrencySelect id="world-from" value={fromCode} onChange={setFrom} codes={codes} />
            </div>
            <Button variant="outline" size="icon" className="justify-self-center" aria-label={t("worldRates.swap")} onClick={() => { setFrom(toCode); setTo(fromCode) }}>
              <ArrowLeftRight />
            </Button>
            <div className="flex min-w-0 flex-col gap-1.5">
              <Label htmlFor="world-to">{t("worldRates.to")}</Label>
              <CurrencySelect id="world-to" value={toCode} onChange={setTo} codes={codes} />
            </div>
          </div>
          <p className="text-2xl tabular-nums" aria-live="polite">
            {result === null ? "—" : `${number(typed, { maximumFractionDigits: 2 })} ${fromCode} = ${rate(result)} ${toCode}`}
          </p>
          {latestDay && (
            <p className="text-xs text-muted-foreground">
              {t("worldRates.asOf", { day: formatDateTime(latestDay, locale, { dateStyle: "medium" }, digitStyle) })}{" "}
              <a href="https://frankfurter.dev" target="_blank" rel="noopener noreferrer" className="underline opacity-70">{t("metals.dataCredit", { name: "Frankfurter" })}</a>
            </p>
          )}
        </section>

        {charted !== "USD" && (
          <section className="flex flex-col gap-2" aria-label={t("worldRates.chartTitle", { currency: charted })}>
            <h3 className="text-sm font-medium">{t("worldRates.chartTitle", { currency: `${charted} · ${names(charted)}` })}</h3>
            {history.points.length < 2 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">{history.loading ? t("common.loading") : t("prices.notEnough")}</p>
            ) : (
              <div dir="ltr">
                <ChartContainer config={config} className="aspect-auto h-56 w-full">
                  <LineChart data={history.points} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="day" tickLine={false} axisLine={false} minTickGap={32}
                      tickFormatter={(v: string) => formatDateTime(v, locale, { month: "short", year: "2-digit" }, digitStyle)} />
                    <YAxis tickLine={false} axisLine={false} width={64} domain={["auto", "auto"]} tickFormatter={(v: number) => rate(v)} />
                    <ChartTooltip content={<ChartTooltipContent labelFormatter={(_, payload) => formatDateTime(String(payload?.[0]?.payload?.day ?? ""), locale, { dateStyle: "medium" }, digitStyle)}
                      formatter={(value) => <span className="font-mono tabular-nums">{rate(Number(value))} {charted}</span>} />} />
                    <Line dataKey="perUsd" type="monotone" stroke="var(--color-perUsd)" strokeWidth={2} dot={false} />
                  </LineChart>
                </ChartContainer>
              </div>
            )}
          </section>
        )}

        <section className="flex flex-col gap-3" aria-label={t("worldRates.list")}>
          <div className="flex flex-col gap-1">
            <h3 className="text-sm font-medium">{query || showAll ? t("worldRates.allTitle") : t("worldRates.followedTitle")}</h3>
            <p className="text-xs text-muted-foreground">{t("worldRates.followHint")}</p>
          </div>
          <Input type="search" placeholder={t("worldRates.search")} aria-label={t("worldRates.search")} value={query} onChange={(e) => setQuery(e.target.value)} />
          {listed.length === 0 ? (
            <p className="text-sm text-muted-foreground">{query ? t("worldRates.noMatch") : t("worldRates.noneFollowed")}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-muted-foreground">
                    <th className="w-8 px-1 py-1"><span className="sr-only">{t("worldRates.follow")}</span></th>
                    <th className="px-2 py-1 text-start font-medium">{t("worldRates.currency")}</th>
                    <th className="whitespace-nowrap px-2 py-1 text-end font-medium">{t("worldRates.inBase", { base })}</th>
                    <th className="whitespace-nowrap px-2 py-1 text-end font-medium">{t("worldRates.perDollar")}</th>
                  </tr>
                </thead>
                <tbody>
                  {listed.map((code) => {
                    const inBase = unitRate(code, base, perUsd)
                    const following = followed.includes(code)
                    return (
                      <tr key={code} className={cn("border-t hover:bg-muted/50", charted === code && "bg-muted")}>
                        <td className="px-1 py-1.5">
                          <Button variant="ghost" size="icon" className="size-8" disabled={saving}
                            aria-label={following ? t("worldRates.unfollow", { currency: code }) : t("worldRates.followOne", { currency: code })}
                            aria-pressed={following} onClick={() => void toggleFollow(code)}>
                            <Star className={cn("size-4", following && "fill-current text-amber-500")} />
                          </Button>
                        </td>
                        <td className="px-2 py-1.5">
                          <button type="button" className="flex flex-col text-start" onClick={() => pick(code)}>
                            <span className="font-medium">{code}</span>
                            <span className="text-xs text-muted-foreground">{names(code)}</span>
                          </button>
                        </td>
                        <td className="whitespace-nowrap px-2 py-1.5 text-end tabular-nums">{inBase === null ? "—" : rate(inBase)}</td>
                        <td className="whitespace-nowrap px-2 py-1.5 text-end tabular-nums">{rate(perUsd[code])}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
          {!query && (
            <Button variant="ghost" size="sm" className="self-start" onClick={() => setShowAll((v) => !v)}>
              {showAll ? t("worldRates.showFollowed") : t("worldRates.showAll", { count: codes.length - 1 })}
            </Button>
          )}
        </section>
      </CardContent>
    </Card>
  )
}
