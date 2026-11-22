import { Gem, Plus, RefreshCw, Settings2 } from "lucide-react"
import { useTranslation } from "react-i18next"

import { formatWhen } from "@/app/dates"
import { HelpButton } from "@/components/HelpButton"
import { SourceCredit } from "@/components/SourceCredit"
import { Button } from "@/components/ui/button"
import { PageTop, Pill, amountHero, card, cardTitle, meta, row } from "@/features/networth/views/parts"
import type { PriceSource } from "@/market/store"
import { DealerProductsCard } from "../DealerProductsCard"
import { SellOrHoldCard } from "../SellOrHoldCard"
import { METALS, WORLD_SOURCE, type MetalsPageModel } from "../useMetalsPage"

const table = "w-full text-sm [&_td]:px-3 [&_td]:py-2.5 [&_td]:whitespace-nowrap [&_th]:px-3 [&_th]:py-2 [&_th]:text-xs [&_th]:font-semibold [&_th]:whitespace-nowrap [&_th]:text-muted-foreground [&_tbody_tr]:border-t [&_tbody_tr]:border-border"
const dot = { GOLD: "bg-gold", SILVER: "bg-muted-foreground" } as const

/** Soft: the gain on a gold card beside the holdings table, then today's prices beside sell-or-hold, then the purchases and sales as rows. */
export default function MetalsSoft({ model }: { model: MetalsPageModel }) {
  const { t } = useTranslation()
  const { view, money, signed, totals, base } = model
  const gold = view.prices.spot.GOLD
  const silver = view.prices.spot.SILVER
  return (
    <div className="flex flex-col gap-4">
      <PageTop title={t("metals.title")}>
        <HelpButton tour="metals" />
        <Button variant="outline" size="icon" aria-label={t("metals.settings")} onClick={() => model.setSettings(true)}><Settings2 /></Button>
        <span className="flex gap-2" data-tour="metals-sell">
          {METALS.map((metal) => (
            <Button key={metal} variant="secondary" disabled={!model.canSell(metal)} onClick={() => model.setSelling(metal)}>{t("metals.sell", { metal: t(`metals.metal.${metal}`) })}</Button>
          ))}
        </span>
        <Button data-tour="metals-add" onClick={() => model.setEditing("new")}><Plus /> {t("metals.addLot")}</Button>
      </PageTop>

      <div className="grid gap-4 lg:grid-cols-12" data-tour="metals-holdings">
        <section className="flex min-w-0 flex-col gap-3 rounded-xl border border-gold/40 bg-gold-soft p-5 lg:col-span-5">
          <h2 className="flex items-center gap-1.5 text-[13px] font-semibold"><Gem className="size-4 text-gold" />{t("metals.gainSincePurchase")}</h2>
          <span className={`${amountHero} ${totals.gain < 0 ? "text-destructive" : totals.gain > 0 ? "text-success" : ""}`}>{signed(totals.gain)}</span>
          <div className="flex justify-between gap-3 text-sm"><span className="text-muted-foreground">{t("metals.costBasis")}</span><span className="tabular-nums">{money(totals.cost)}</span></div>
          <div className="flex justify-between gap-3 text-sm"><span className="text-muted-foreground">{t("metals.valueNow")}</span><span className="font-semibold tabular-nums">{money(totals.value)}</span></div>
          <p className={meta}>{t("metals.excludingMaking", { amount: signed(totals.gainX) })}</p>
        </section>

        <section className={`${card} lg:col-span-7`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className={cardTitle}>{t("metals.portfolio")}</h2>
            {view.setting?.valuationBasis === "BUYBACK" && <Pill>{t("metals.buybackBadge")}</Pill>}
          </div>
          {view.lines.length === 0 && <p className="text-muted-foreground">{t("metals.noLots")}</p>}
          {view.lines.length > 0 && (
            <div className="overflow-x-auto">
              <table className={table}>
                <thead>
                  <tr>
                    <th className="text-start">{t("metals.purity")}</th>
                    <th className="text-end">{t("metals.weight")}</th>
                    <th className="text-end">{t("metals.costBasis")}</th>
                    <th className="text-end">{t("metals.valueNow")}</th>
                    <th className="text-end">{t("metals.gain")}</th>
                  </tr>
                </thead>
                <tbody>
                  {view.lines.map((line) => (
                    <tr key={`${line.metal}-${line.purityLabel}`}>
                      <td><span className="flex items-center gap-2 font-medium"><span className={`size-2.5 rounded-full ${dot[line.metal]}`} />{t(`metals.metal.${line.metal}`)} {line.purityLabel}</span></td>
                      <td className="text-end tabular-nums">{model.grams(line.weightMg)}</td>
                      <td className="text-end tabular-nums">{money(line.costBasis)}</td>
                      <td className="text-end tabular-nums">{money(line.valueNow)}</td>
                      <td className={`text-end font-semibold tabular-nums ${line.gain < 0 ? "text-destructive" : line.gain > 0 ? "text-success" : ""}`}>{signed(line.gain)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        <section className={`${card} ${model.dinar ? "lg:col-span-7" : "lg:col-span-12"}`}>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <h2 className={cardTitle}>{t("metals.priceTable")}</h2>
              <p className={`${meta} flex flex-wrap items-center gap-1.5`}>
                {model.goldAt ? t("metals.priceTableBody", { at: formatWhen(model.goldAt, model.language), source: gold.source.label }) : t("metals.priceTableNoPrice")}
                {gold.source.stale && <Pill tone="warn">{t("metals.stale")}</Pill>}
              </p>
            </div>
            <Button size="sm" variant="outline" disabled={model.refreshing || !model.online} onClick={() => void model.refreshPrices()}><RefreshCw className={model.refreshing ? "animate-spin" : ""} /> {t("metals.refresh")}</Button>
          </div>
          <div className="overflow-x-auto">
            <table className={table}>
              <thead>
                <tr>
                  <th className="text-start">{t("metals.purity")}</th>
                  <th className="text-end">{base}/g</th>
                  <th className="text-end">{base}/{t("metals.units.MITHQAL")}</th>
                  <th className="text-end">USD/g</th>
                  <th className="text-end">USD/{t("metals.units.MITHQAL")}</th>
                </tr>
              </thead>
              <tbody>
                {model.table.map((line) => (
                  <tr key={`${line.metal}-${line.purityLabel}`}>
                    <td className="font-medium">{t(`metals.metal.${line.metal}`)} {line.purityLabel}</td>
                    <td className="text-end tabular-nums">{money(Math.round(line.perGramMicros / 1e6))}</td>
                    <td className="text-end tabular-nums">{money(Math.round(line.perMithqalMicros / 1e6))}</td>
                    <td className="text-end tabular-nums" dir="ltr">{model.usd(line.perGramUsdMicros)}</td>
                    <td className="text-end tabular-nums" dir="ltr">{model.usd(line.perMithqalUsdMicros)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {model.showUsdNote && <p className="text-xs text-muted-foreground">{t("metals.usdNote", { rate: money(Math.round(view.prices.usdBaseMicros / 1e6)), kind: model.dinar ? t(`metals.rateKinds.${view.prices.rateKind}`) : WORLD_SOURCE.label })}</p>}
        </section>
        {model.dinar && <div className="min-w-0 lg:col-span-5 [&>*]:h-full"><SellOrHoldCard view={view} currency={base} /></div>}
      </div>

      {model.dinar && <DealerProductsCard currency={base} />}

      <section className={card} data-tour="metals-prices">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className={cardTitle}>{t("metals.prices")}</h2>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="ghost" className="text-link" onClick={() => model.setExplaining(true)}>{t("metals.howCalculated")}</Button>
            <Button size="sm" variant="outline" onClick={() => model.setOverriding(true)}>{t("metals.enterPrice")}</Button>
            <Button size="sm" variant="outline" onClick={() => model.setZakat(true)}>{t("zakat.open")}</Button>
          </div>
        </div>
        <div>
          <PriceLine label={t("metals.metal.GOLD")} source={gold.source} value={gold.perGram24kOverrideMicros !== null ? `${money(Math.round(gold.perGram24kOverrideMicros / 1e6))}/g 24k` : `$${(gold.spotUsdPerOzMicros / 1e6).toFixed(2)}/oz`} />
          <PriceLine label={t("metals.metal.SILVER")} source={silver.source} value={silver.perGram24kOverrideMicros !== null ? `${money(Math.round(silver.perGram24kOverrideMicros / 1e6))}/g` : `$${(silver.spotUsdPerOzMicros / 1e6).toFixed(2)}/oz`} />
          {model.dinar
            ? <PriceLine label={`USD → ${base} (${t(`metals.rateKinds.${view.prices.rateKind}`)})`} source={view.prices.rateSource} value={money(Math.round(view.prices.usdIqdMicros / 1e6))} />
            : <PriceLine label={`USD → ${base}`} source={WORLD_SOURCE} value={money(Math.round(view.prices.usdBaseMicros / 1e6))} />}
        </div>
      </section>

      <section className={card}>
        <h2 className={cardTitle}>{t("metals.lots")}</h2>
        {model.openLots.length === 0 && <p className="text-muted-foreground">{t("metals.noLots")}</p>}
        <div>
          {model.openLots.map((v) => (
            <div key={v.lot.id} className={`${row} cursor-pointer`} onClick={() => model.setEditing(v.lot)}>
              <span className={`size-2.5 shrink-0 rounded-full ${dot[v.lot.metal]}`} />
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-medium">{t(`metals.metal.${v.lot.metal}`)} {v.lot.purityLabel} · {model.grams(v.remainingMg)} · {t(`metals.forms.${v.lot.form}`)}</span>
                <span className="truncate text-xs text-muted-foreground">{v.lot.purchaseDate}{v.lot.dealer ? ` · ${v.lot.dealer}` : ""} · {t("metals.perGram", { cost: money(v.costPerGramBase), now: money(v.perGramNowBase) })}</span>
              </div>
              <div className="flex shrink-0 flex-col items-end">
                <span className="font-medium tabular-nums">{money(v.valueNow)}</span>
                <span className={`text-[13px] font-semibold tabular-nums ${v.gain < 0 ? "text-destructive" : v.gain > 0 ? "text-success" : ""}`}>{signed(v.gain)}{v.gainPercent !== null ? ` (${v.gainPercent}%)` : ""}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {model.sales.length > 0 && (
        <section className={card}>
          <h2 className={cardTitle}>{t("metals.sales")}</h2>
          <div>
            {model.sales.map(({ disposal, realised }) => (
              <div key={disposal.id} className={row}>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm font-medium">{disposal.soldOn} · {t(`metals.metal.${disposal.metal}`)} {model.grams(disposal.weightMg)}</span>
                  <span className="text-xs text-muted-foreground">{t(`metals.methods.${disposal.method}`)} · {t("metals.excludingMaking", { amount: signed(realised.gainExcludingMaking) })}</span>
                </div>
                <span className={`font-semibold tabular-nums ${realised.gain < 0 ? "text-destructive" : realised.gain > 0 ? "text-success" : ""}`}>{signed(realised.gain)}</span>
                <Button size="sm" variant="ghost" className="text-link" onClick={() => model.undoSale(disposal)}>{t("bills.undo")}</Button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function PriceLine({ label, value, source }: { label: string; value: string; source: PriceSource }) {
  const { t, i18n } = useTranslation()
  const when = source.at ? formatWhen(source.at, i18n.language, { dateStyle: "medium", timeStyle: source.kind === "feed" || source.kind === "local" ? "short" : undefined }) : ""
  return (
    <div className={`${row} flex-wrap justify-between text-sm`}>
      <span>{label}: <span className="font-semibold tabular-nums">{value}</span></span>
      <span className="flex flex-wrap items-center gap-1.5">
        <Pill>{source.kind === "override" ? t("metals.sources.override") : source.kind === "feed" || source.kind === "local" ? source.label : t("metals.sources.none")}</Pill>
        {source.stale && <Pill tone="warn">{t("metals.stale")}</Pill>}
        <span className="text-xs text-muted-foreground">{when}</span>
        {source.kind === "feed" && <SourceCredit source={source.label} />}
      </span>
    </div>
  )
}
