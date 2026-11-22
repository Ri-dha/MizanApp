import { useTranslation } from "react-i18next"
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"

import { SourceCredit } from "@/components/SourceCredit"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { PageTop, Pill, amountHero, card, cardTitle, heroCard, meta, row } from "@/features/networth/views/parts"
import { cn } from "@/lib/utils"
import { RANGES } from "@/market/prices"
import { axisNumber, type PricesPageModel } from "../usePricesPage"
import { WorldRatesCard } from "../WorldRatesCard"

/** Soft: the chosen price as a hero card with tabs for the series and a segmented range, every change as rows beside it. */
export default function PricesSoft({ model }: { model: PricesPageModel }) {
  const { t } = useTranslation()
  const { latest, moved } = model
  const config = { value: { label: t(`prices.series.${model.seriesKey}`), color: "var(--chart-1)" } } satisfies ChartConfig
  return (
    <div className="flex flex-col gap-4">
      <PageTop title={t("prices.title")} />

      {!model.iraqi && <WorldRatesCard />}

      <div className="grid gap-4 lg:grid-cols-12">
        <section className={`${heroCard} lg:col-span-8`}>
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <div role="tablist" aria-label={t("prices.pick")} className="flex min-w-0 flex-wrap gap-1">
              {model.keys.map((key) => (
                <button key={key} type="button" role="tab" aria-selected={key === model.seriesKey} onClick={() => model.setKey(key)}
                  className={cn("border-b-[3px] border-transparent px-3 py-2 text-sm text-muted-foreground", key === model.seriesKey && "border-primary font-semibold text-foreground")}>
                  {t(`prices.series.${key}`)}
                </button>
              ))}
            </div>
            <div role="radiogroup" aria-label={t("prices.range")} className="inline-flex gap-0.5 rounded-lg bg-muted p-[3px]">
              {RANGES.map((range) => (
                <button key={range} type="button" role="radio" aria-checked={range === model.range} onClick={() => model.setRange(range)}
                  className={cn("rounded-md px-3 py-1 text-[13px] text-muted-foreground", range === model.range && "bg-card font-semibold text-foreground shadow-card")}>
                  {t(`prices.ranges.${range}`)}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap items-baseline gap-3">
            <span className={amountHero}>{latest ? model.format(latest.value) : "—"}</span>
            {moved && <span className={cn("font-semibold tabular-nums", moved.value > 0 && "text-success", moved.value < 0 && "text-destructive")}>{moved.value > 0 ? "▲ " : moved.value < 0 ? "▼ " : ""}{moved.text} {t(`prices.since.${model.range}`)}</span>}
          </div>
          <p className={meta}>
            {t(`prices.units.${model.unit}`)}
            {model.gap !== null && <> · {t("prices.gap", { percent: model.gap.toFixed(1) })}</>}
          </p>
          {model.data.length < 2 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">{model.loading ? t("common.loading") : t("prices.notEnough")}</p>
          ) : (
            <div dir="ltr">
              <ChartContainer config={config} className="aspect-auto h-56 w-full">
                <LineChart data={model.data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="at" tickLine={false} axisLine={false} minTickGap={32} tickFormatter={model.tick} />
                  <YAxis tickLine={false} axisLine={false} width={64} domain={["auto", "auto"]} tickFormatter={axisNumber} />
                  <ChartTooltip content={<ChartTooltipContent labelFormatter={(_, payload) => model.when(String(payload?.[0]?.payload?.at ?? ""), model.shortRange)}
                    formatter={(value) => <span className="font-mono tabular-nums">{model.format(Number(value))}</span>} />} />
                  <Line dataKey="value" type={model.shortRange ? "stepAfter" : "monotone"} stroke="var(--color-value)" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ChartContainer>
            </div>
          )}
          {latest && (
            <p className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              {t("prices.updated", { when: model.when(latest.at, true), source: latest.source })}
              <SourceCredit source={latest.source} />
            </p>
          )}
        </section>

        <section className={`${card} lg:col-span-4`}>
          <div>
            <h2 className={cardTitle}>{t("prices.changes")}</h2>
            <p className={meta}>{t("prices.changesBody")}</p>
          </div>
          {model.changes.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("prices.noChanges")}</p>
          ) : (
            <div className="max-h-[26rem] overflow-y-auto">
              {model.changes.map((change) => (
                <div key={change.id} className={row}>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="text-sm font-medium tabular-nums">{change.value}</span>
                    <span className="truncate text-xs text-muted-foreground">{change.at} · {change.source}</span>
                  </span>
                  {change.delta === null
                    ? <Pill>{t("prices.firstPrice")}</Pill>
                    : <Pill tone={change.delta > 0 ? "ok" : change.delta < 0 ? "bad" : "neutral"} className="tabular-nums">{change.delta > 0 ? "▲ " : change.delta < 0 ? "▼ " : ""}{change.deltaText}</Pill>}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {model.iraqi && <WorldRatesCard />}
    </div>
  )
}
