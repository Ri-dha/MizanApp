import { Armchair, Building2, Car, Laptop, Package, PawPrint, Plus, TriangleAlert, Wrench } from "lucide-react"
import { useTranslation } from "react-i18next"

import { HelpButton } from "@/components/HelpButton"
import { Button } from "@/components/ui/button"
import type { AssetType } from "@/db/schema"
import { Lead, PageTop, Pill, amountHero, card, cardTitle, eyebrow, heroCard, meta, row } from "@/features/networth/views/parts"
import type { AssetsPageModel } from "../useAssetsPage"

const ICONS: Record<AssetType, typeof Car> = { VEHICLE: Car, PROPERTY: Building2, ELECTRONICS: Laptop, EQUIPMENT: Wrench, FURNITURE: Armchair, LIVESTOCK: PawPrint, OTHER: Package }
const tone = (value: number) => (value < 0 ? "text-destructive" : value > 0 ? "text-success" : "")

/** Soft: the total with its change since purchase on a hero card, then one card per kind with each asset as a row. */
export default function AssetsSoft({ model }: { model: AssetsPageModel }) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col gap-4">
      <PageTop title={t("assets.title")}>
        <HelpButton tour="assets" />
        <Button data-tour="assets-add" onClick={() => model.setEditing("new")}><Plus /> {t("assets.add")}</Button>
      </PageTop>

      <section className={`${heroCard} flex-row flex-wrap items-end gap-x-10 gap-y-3`} data-tour="assets-total">
        <span className="flex flex-col gap-1">
          <h2 className={eyebrow}>{t("assets.totalTitle")}</h2>
          <span className={amountHero}>{model.total}</span>
        </span>
        {model.heldCount > 0 && (
          <span className="flex flex-col gap-1">
            <span className={meta}>{t("assets.sincePurchaseLabel")}</span>
            <span className={`text-[22px] leading-8 font-semibold tabular-nums ${tone(model.changeBase)}`}>{model.signed(model.changeBase)}</span>
          </span>
        )}
        <span className={`${meta} pb-1.5`}>{t("assets.totalBody", { count: model.heldCount })}</span>
      </section>

      {model.heldCount === 0 && <p className="text-muted-foreground">{t("assets.none")}</p>}

      {model.groups.map((group) => (
        <section key={group.type} className={card} data-tour={group.first ? "assets-list" : undefined}>
          <h2 className={cardTitle}>{t(`assets.types.${group.type}`)}</h2>
          <div>
            {group.rows.map((line) => (
              <div key={line.asset.id} className={`${row} flex-wrap items-start py-4`}>
                <Lead icon={ICONS[group.type]} className="bg-muted text-muted-foreground" />
                <span className="flex min-w-0 flex-[1_1_16rem] flex-col gap-1.5">
                  <span className="flex flex-wrap items-center gap-2">
                    <button type="button" className="text-start font-semibold" onClick={() => model.setEditing(line.asset)}>{line.asset.name}</button>
                    {line.asset.liquidity === "ILLIQUID" && <Pill>{t("assets.illiquidBadge")}</Pill>}
                    {line.asset.visibility === "PRIVATE" && <Pill>{t("accounts.private")}</Pill>}
                    {line.stale && <Pill tone="warn" icon={TriangleAlert}>{t("assets.staleBadge")}</Pill>}
                  </span>
                  {line.attributes && <span className={meta}>{line.attributes}</span>}
                  <span className={meta}>{line.sourceLine}</span>
                  {line.tcoLine && <span className={`${meta} tabular-nums`}>{line.tcoLine}</span>}
                  <span className="flex flex-wrap gap-2">
                    <Button size="sm" data-tour={line.first ? "assets-value" : undefined} onClick={() => model.openAction("value", line.asset)}>{t("assets.addValuation")}</Button>
                    <Button size="sm" variant="secondary" onClick={() => model.openAction("sell", line.asset)}>{t("assets.sell")}</Button>
                  </span>
                  {line.history.length > 0 && (
                    <span className="mt-1 flex flex-col">
                      <span className="text-xs font-semibold text-muted-foreground">{t("assets.history")}</span>
                      {line.history.map((entry) => (
                        <span key={entry.id} className="flex items-center justify-between gap-2 border-t border-border py-1 text-sm first:border-t-0">
                          <span className="min-w-0 truncate">{entry.label}</span>
                          <span className="flex shrink-0 items-center gap-1 tabular-nums">{entry.value}
                            <Button size="sm" variant="ghost" className="text-link" onClick={() => model.removeValuation(entry.id)}>{t("bills.undo")}</Button>
                          </span>
                        </span>
                      ))}
                    </span>
                  )}
                </span>
                <span className="flex flex-col items-end gap-1">
                  <span className="text-[22px] leading-8 font-semibold tabular-nums">{line.value}</span>
                  {line.inBaseLine && <span className={`${meta} tabular-nums`}>{line.inBaseLine}</span>}
                  <span className={`text-sm font-semibold tabular-nums ${tone(line.change)}`}>{line.changeLine}</span>
                </span>
              </div>
            ))}
          </div>
        </section>
      ))}

      {model.sold.length > 0 && (
        <section className={card}>
          <Button variant="ghost" className="self-start text-link" onClick={() => model.setShowSold((s) => !s)}>{t("assets.soldToggle", { count: model.sold.length })}</Button>
          {model.showSold && (
            <div>
              {model.sold.map((line) => (
                <div key={line.asset.id} className={row}>
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="flex flex-wrap items-center gap-2 font-semibold">{line.asset.name}<Pill tone="ok">{t("assets.soldBadge")}</Pill></span>
                    <span className={meta}>{line.line}</span>
                  </span>
                  <span className={`font-semibold tabular-nums ${tone(line.gain)}`}>{line.gainText}</span>
                  <Button size="sm" variant="ghost" className="text-link" onClick={() => model.unsell(line.asset.id)}>{t("bills.undo")}</Button>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  )
}
