import { CircleCheck, Plus, Star, Target, TriangleAlert } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { Lead, PageTop, Pill, Progress, amountLarge, card, cardTitle, meta } from "@/features/networth/views/parts"
import { fillAt } from "@/features/networth/views/shared"
import type { GoalState, GoalsPageModel } from "../useGoalsPage"

const BADGE: Record<Exclude<GoalState, null>, { tone: "ok" | "warn"; icon: typeof Star; key: string }> = {
  reached: { tone: "ok", icon: Star, key: "goals.completed" },
  onTrack: { tone: "ok", icon: CircleCheck, key: "goals.onTrack" },
  behind: { tone: "warn", icon: TriangleAlert, key: "goals.behind" },
}

/** Soft: a card per goal, three across, each with its progress, where it is heading and the two actions. */
export default function GoalsSoft({ model }: { model: GoalsPageModel }) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col gap-4">
      <PageTop title={t("goals.title")}>
        <Button onClick={() => model.setEditing("new")}><Plus /> {t("goals.add")}</Button>
      </PageTop>

      {model.cards.length === 0 && <p className="text-muted-foreground">{t("goals.none")}</p>}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {model.cards.map((item, index) => {
          const badge = item.state && BADGE[item.state]
          return (
            <section key={item.goal.id} className={card}>
              <div className="flex items-center justify-between gap-2">
                <button type="button" className="flex min-w-0 items-center gap-2.5 text-start" onClick={() => model.setEditing(item.goal)}>
                  <Lead icon={Target} className={`size-9 rounded-full text-background ${fillAt(index)}`} />
                  <h2 className={`${cardTitle} truncate`}>{item.goal.name}</h2>
                </button>
                {badge && <Pill tone={badge.tone} icon={badge.icon}>{t(badge.key)}</Pill>}
              </div>
              <span className="flex flex-wrap items-baseline gap-x-2">
                <span className={amountLarge}>{item.saved}</span>
                <span className={`${meta} tabular-nums`}>{t("goals.ofTarget", { amount: item.target })}</span>
              </span>
              <Progress percent={item.percent} tone={item.state === "behind" ? "warn" : "ok"} />
              <span className={`${meta} tabular-nums`}>{item.percent}% · {item.note}</span>
              {item.includesSaved && <span className="text-xs text-muted-foreground">{item.includesSaved}</span>}
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={() => model.setDepositing({ goal: item.goal, direction: "DEPOSIT" })}>{t("goals.deposit")}</Button>
                <Button size="sm" variant="secondary" onClick={() => model.setDepositing({ goal: item.goal, direction: "WITHDRAWAL" })}>{t("goals.withdraw")}</Button>
              </div>
              {item.ledger.length > 0 && (
                <div>
                  {item.ledger.map((entry) => (
                    <div key={entry.deposit.id} className="flex items-center justify-between gap-2 border-t border-border py-1 text-sm first:border-t-0">
                      <span className="min-w-0 truncate">{entry.label}</span>
                      <span className="flex shrink-0 items-center gap-1 tabular-nums">{entry.amount}
                        <Button size="sm" variant="ghost" className="text-link" onClick={() => model.undo(entry.deposit)}>{t("bills.undo")}</Button>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )
        })}
      </div>
    </div>
  )
}
