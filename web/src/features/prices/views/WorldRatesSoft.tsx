import { ArrowLeftRight, Star } from "lucide-react"
import { useTranslation } from "react-i18next"
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"

import { Button } from "@/components/ui/button"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CurrencySelect } from "@/features/currency/CurrencySelect"
import { amountLarge, card, cardTitle, meta, row } from "@/features/networth/views/parts"
import { cn } from "@/lib/utils"
import type { WorldRatesModel } from "../useWorldRates"

/** Soft: the converter on one card and the followed currencies as rows on the other, side by side. */
export default function WorldRatesSoft({ model }: { model: WorldRatesModel }) {
  const { t } = useTranslation()
  const { charted, history } = model
  const config = { perUsd: { label: t("worldRates.perUsd", { currency: charted }), color: "var(--chart-2)" } } satisfies ChartConfig

  if (!model.available) {
    return (
      <section className={card}>
        <h2 className={cardTitle}>{t("worldRates.title")}</h2>
        <p className={meta}>{t("worldRates.none")}</p>
      </section>
    )
  }

  return (
    <div className="grid gap-4 lg:grid-cols-12">
      <section className={`${card} lg:col-span-6`} aria-label={t("worldRates.convert")}>
        <div>
          <h2 className={cardTitle}>{t("worldRates.title")}</h2>
          <p className={meta}>{model.intro}{model.dinarLine && <> {model.dinarLine}</>}</p>
        </div>
        <div className="flex flex-wrap items-end gap-2.5">
          <div className="flex min-w-0 flex-[1_1_160px] flex-col gap-1.5">
            <Label htmlFor="world-amount">{t("worldRates.amount")}</Label>
            <Input id="world-amount" inputMode="decimal" dir="ltr" value={model.amount} onChange={(e) => model.setAmount(e.target.value)} />
          </div>
          <div className="flex min-w-0 flex-[1_1_120px] flex-col gap-1.5">
            <Label htmlFor="world-from">{t("worldRates.from")}</Label>
            <CurrencySelect id="world-from" value={model.fromCode} onChange={model.setFrom} codes={model.codes} />
          </div>
          <Button variant="ghost" size="icon" aria-label={t("worldRates.swap")} onClick={model.swap}><ArrowLeftRight /></Button>
          <div className="flex min-w-0 flex-[1_1_120px] flex-col gap-1.5">
            <Label htmlFor="world-to">{t("worldRates.to")}</Label>
            <CurrencySelect id="world-to" value={model.toCode} onChange={model.setTo} codes={model.codes} />
          </div>
        </div>
        <p className={amountLarge} aria-live="polite">
          {model.result === null ? "—" : `${model.rate(model.result)} ${model.toCode}`}
        </p>
        {model.result !== null && <p className={`${meta} tabular-nums`}>{model.number(model.typed, { maximumFractionDigits: 2 })} {model.fromCode}</p>}
        {model.latestDay && (
          <p className="text-xs text-muted-foreground">
            {t("worldRates.asOf", { day: model.date(model.latestDay, { dateStyle: "medium" }) })}{" "}
            <a href="https://frankfurter.dev" target="_blank" rel="noopener noreferrer" className="underline opacity-70">{t("metals.dataCredit", { name: "Frankfurter" })}</a>
          </p>
        )}

        {charted !== "USD" && (
          <div className="flex flex-col gap-2 border-t border-border pt-3" aria-label={t("worldRates.chartTitle", { currency: charted })}>
            <h3 className="text-[13px] font-semibold text-muted-foreground">{t("worldRates.chartTitle", { currency: `${charted} · ${model.names(charted)}` })}</h3>
            {history.points.length < 2 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">{history.loading ? t("common.loading") : t("prices.notEnough")}</p>
            ) : (
              <div dir="ltr">
                <ChartContainer config={config} className="aspect-auto h-48 w-full">
                  <LineChart data={history.points} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="day" tickLine={false} axisLine={false} minTickGap={32} tickFormatter={(v: string) => model.date(v, { month: "short", year: "2-digit" })} />
                    <YAxis tickLine={false} axisLine={false} width={64} domain={["auto", "auto"]} tickFormatter={(v: number) => model.rate(v)} />
                    <ChartTooltip content={<ChartTooltipContent labelFormatter={(_, payload) => model.date(String(payload?.[0]?.payload?.day ?? ""), { dateStyle: "medium" })}
                      formatter={(value) => <span className="font-mono tabular-nums">{model.rate(Number(value))} {charted}</span>} />} />
                    <Line dataKey="perUsd" type="monotone" stroke="var(--color-perUsd)" strokeWidth={2.5} dot={false} />
                  </LineChart>
                </ChartContainer>
              </div>
            )}
          </div>
        )}
      </section>

      <section className={`${card} lg:col-span-6`} aria-label={t("worldRates.list")}>
        <div>
          <h2 className={cardTitle}>{model.query || model.showAll ? t("worldRates.allTitle") : t("worldRates.followedTitle")}</h2>
          <p className={meta}>{t("worldRates.followHint")}</p>
        </div>
        <Input type="search" placeholder={t("worldRates.search")} aria-label={t("worldRates.search")} value={model.query} onChange={(e) => model.setQuery(e.target.value)} />
        {model.listed.length === 0 ? (
          <p className="text-sm text-muted-foreground">{model.query ? t("worldRates.noMatch") : t("worldRates.noneFollowed")}</p>
        ) : (
          <div>
            <div className="flex items-center gap-3 pb-1 text-xs font-semibold text-muted-foreground">
              <span className="w-8"><span className="sr-only">{t("worldRates.follow")}</span></span>
              <span className="flex-1">{t("worldRates.currency")}</span>
              <span className="w-24 text-end">{t("worldRates.inBase", { base: model.base })}</span>
              <span className="w-20 text-end">{t("worldRates.perDollar")}</span>
            </div>
            {model.listed.map((line) => (
              <div key={line.code} className={cn(row, "py-1.5", charted === line.code && "bg-muted")}>
                <Button variant="ghost" size="icon" className="size-8" disabled={model.saving}
                  aria-label={line.following ? t("worldRates.unfollow", { currency: line.code }) : t("worldRates.followOne", { currency: line.code })}
                  aria-pressed={line.following} onClick={() => void model.toggleFollow(line.code)}>
                  <Star className={cn("size-4 text-muted-foreground", line.following && "fill-current text-gold")} />
                </Button>
                <button type="button" className="flex min-w-0 flex-1 flex-col text-start" onClick={() => model.pick(line.code)}>
                  <span className="text-sm font-medium">{line.name}</span>
                  <span className="text-xs text-muted-foreground">{line.code}</span>
                </button>
                <span className="w-24 text-end font-medium tabular-nums">{line.inBase === null ? "—" : model.rate(line.inBase)}</span>
                <span className="w-20 text-end text-[13px] text-muted-foreground tabular-nums">{model.rate(line.perDollar)}</span>
              </div>
            ))}
          </div>
        )}
        {!model.query && (
          <Button variant="ghost" size="sm" className="self-start text-link" onClick={() => model.setShowAll((v) => !v)}>
            {model.showAll ? t("worldRates.showFollowed") : t("worldRates.showAll", { count: model.codes.length - 1 })}
          </Button>
        )}
      </section>
    </div>
  )
}
