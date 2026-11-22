import { useTranslation } from "react-i18next"
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

import { HelpButton } from "@/components/HelpButton"
import { SourceCredit } from "@/components/SourceCredit"
import { Button } from "@/components/ui/button"
import { ATTRIBUTION_KEYS, type NetWorthPageModel } from "../useNetWorthPage"
import { PageTop, Pill, ShareBar, amountHero, amountLarge, card, cardTitle, eyebrow, heroCard, meta, row } from "./parts"
import { fillAt } from "./shared"

/** Soft: the headline figure as a hero card beside what is owed, then what changed, the trend, and the months as rows. */
export default function NetWorthSoft({ model }: { model: NetWorthPageModel }) {
  const { t } = useTranslation()
  const { view, money, attribution } = model
  const shares = model.composition.map((share, index) => ({ key: share.assetClass, label: t(`networth.classes.${share.assetClass}`), percent: share.percent, fill: fillAt(index) }))
  return (
    <div className="flex flex-col gap-4">
      <PageTop title={t("networth.title")}><HelpButton tour="networth" /></PageTop>

      <div className="grid gap-4 lg:grid-cols-12" data-tour="networth-headline">
        <section className={`${heroCard} lg:col-span-7`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className={eyebrow}>{t("networth.headline")}</h2>
            <span className={meta}>{t("networth.formula")}</span>
          </div>
          <div className="flex flex-wrap items-baseline gap-3">
            <span className={`${amountHero} ${view.current.netWorth < 0 ? "text-destructive" : ""}`}>{money(view.current.netWorth)}</span>
            {model.usd && <span className="text-muted-foreground tabular-nums">≈ {model.usd} <span className="text-xs">({model.rateKind})</span></span>}
          </div>
          {model.householdNetWorth !== null && <p className={meta}>{t("networth.householdFigure", { value: money(model.householdNetWorth) })}</p>}
          <ShareBar shares={shares} />
        </section>

        <section className={`${card} lg:col-span-5`}>
          <h2 className={eyebrow}>{t("networth.liabilities")}</h2>
          <span className={amountLarge}>{money(view.current.totalLiabilities)}</span>
          <p className="text-xs text-muted-foreground">
            {model.ratesNote}
            {model.dinar && <>{" "}<SourceCredit source={String(view.rateSet.usdIqdSource)} /></>}
          </p>
        </section>
      </div>

      <section className={card}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className={cardTitle}>{t("networth.assets")}</h2>
          <span className={meta}>{t("networth.liquidLine", { liquid: money(view.current.liquidAssets), illiquid: money(view.current.illiquidAssets) })}</span>
        </div>
        <span className={amountLarge}>{money(view.current.totalAssets)}</span>
        <div>
          {model.composition.map((share, index) => (
            <div key={share.assetClass} className={row}>
              <span className={`size-3 shrink-0 rounded-full ${fillAt(index)}`} />
              <span className="min-w-0 flex-1 text-sm font-medium">{t(`networth.classes.${share.assetClass}`)}</span>
              <span className={`${meta} tabular-nums`}>{share.percent}%</span>
              <span className="font-medium tabular-nums">{money(share.amount)}</span>
            </div>
          ))}
        </div>
      </section>

      {attribution && (
        <section className={card}>
          <div>
            <h2 className={cardTitle}>{t("networth.attributionTitle", { month: model.attributionMonth })}</h2>
            <p className={meta}>{t("networth.attributionBody")}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {ATTRIBUTION_KEYS.map((key) => (
              <div key={key} className={`flex flex-col gap-1 rounded-lg p-3 ${key === "total" ? "bg-accent text-accent-foreground" : "bg-muted"}`}>
                <span className="text-xs text-muted-foreground">{t(`networth.attribution.${key}`)}</span>
                <span className={`font-semibold tabular-nums ${attribution[key] < 0 ? "text-destructive" : ""}`}>{(attribution[key] > 0 ? "+" : "") + money(attribution[key])}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className={card} data-tour="networth-trend">
        <div>
          <h2 className={cardTitle}>{t("networth.trend")}</h2>
          <p className={meta}>{t("networth.trendBody")}</p>
        </div>
        <div dir="ltr" className="h-64 w-full">
          <ResponsiveContainer>
            <LineChart data={model.trend} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
              <CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis dataKey="label" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v: number) => new Intl.NumberFormat("en", { notation: "compact" }).format(v)} width={56} />
              <Tooltip formatter={(v) => money(Number(v))} contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--foreground)" }} />
              <Line type="monotone" dataKey="value" stroke="var(--chart-1)" strokeWidth={2.5} dot={{ r: 4, fill: "var(--chart-1)", strokeWidth: 0 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className={card} data-tour="networth-months">
        <div>
          <h2 className={cardTitle}>{t("networth.months")}</h2>
          <p className={meta}>{t("networth.monthsBody")}</p>
        </div>
        <div>
          {model.months.map((month) => (
            <div key={month.key} className={`${row} flex-wrap`}>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="flex items-center gap-2 text-sm font-medium">{month.label} {month.closed && <Pill tone="ok">{t("networth.closedBadge")}</Pill>}</span>
                {month.snapshotLine && <span className="text-xs text-muted-foreground">{month.snapshotLine}</span>}
              </div>
              <Button size="sm" variant={month.closed ? "outline" : "default"} disabled={model.busy === month.key || !model.online} onClick={() => void model.act(month.key, month.closed ? "reopen" : "close")}>
                {month.closed ? t("networth.reopen") : t("networth.close")}
              </Button>
            </div>
          ))}
        </div>
        {!model.online && <p className="text-xs text-muted-foreground">{t("networth.needsOnline")}</p>}
      </section>
    </div>
  )
}
