import { CircleAlert, CircleCheck, Pencil, RefreshCw } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import type { SyncPageModel } from "../useSyncPage"

const card = "flex max-w-[860px] min-w-0 flex-col gap-3 rounded-[10px] border border-border bg-card p-5 shadow-card"
const title = "text-base leading-[22px] font-semibold"
const meta = "text-[13px] text-muted-foreground"

/** Soft: the state of sync as one headline card with its button, then what was refused and what was overridden. */
export default function SyncSoft({ model }: { model: SyncPageModel }) {
  const { t } = useTranslation()
  const Icon = model.state === "error" ? CircleAlert : model.state === "busy" ? RefreshCw : CircleCheck
  const tone = model.state === "error" ? "bg-destructive-soft text-destructive" : model.state === "busy" ? "bg-warning-soft text-foreground" : "bg-success-soft text-success"
  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-3xl">{t("sync.title")}</h1>

      <section className={`${card} flex-row flex-wrap items-center gap-4 border-transparent shadow-sheet`}>
        <span className={`grid size-12 shrink-0 place-items-center rounded-full ${tone}`}><Icon className={`size-6 ${model.syncing ? "animate-spin" : ""}`} /></span>
        <span className="flex min-w-0 flex-1 basis-48 flex-col">
          <span className="text-lg font-semibold">{model.headline}</span>
          <span className={meta}>{model.detail}</span>
        </span>
        <Button className="h-10" onClick={model.syncNow} disabled={model.syncing}>
          <RefreshCw className={model.syncing ? "animate-spin" : ""} /> {t("sync.syncNow")}
        </Button>
      </section>

      {model.rejections.length > 0 && (
        <section className={card}>
          <div className="flex items-center justify-between gap-2">
            <h2 className={title}>{t("sync.rejectedTitle")}</h2>
            <span className="inline-flex h-[22px] items-center rounded-full bg-destructive-soft px-2 text-xs font-semibold text-destructive tabular-nums">{model.rejections.length}</span>
          </div>
          <p className="flex items-start gap-2 rounded-lg bg-destructive-soft px-3 py-2 text-sm"><CircleAlert className="mt-0.5 size-4 shrink-0 text-destructive" />{t("sync.rejectedBody")}</p>
          <div className="flex flex-col">
            {model.rejections.map((rejection) => (
              <div key={rejection.opId} className="flex flex-wrap items-center gap-3 border-t border-border py-2.5 first:border-t-0">
                <span className="flex min-w-0 flex-1 flex-col text-sm">
                  <span className="font-semibold">{t(`sync.tables.${rejection.table}`)} · {model.when(rejection.rejectedAt)}</span>
                  <span className="text-muted-foreground">{t("sync.rejectedReason", { code: rejection.code })}</span>
                </span>
                <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => model.dismissRejection(rejection.opId)}>{t("sync.dismiss")}</Button>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className={card}>
        <div>
          <h2 className={title}>{t("sync.conflictsTitle")}</h2>
          <p className={meta}>{t("sync.conflictsBody")}</p>
        </div>
        {model.conflicts.length === 0 && <p className="text-muted-foreground">{t("sync.noConflicts")}</p>}
        <div className="flex flex-col">
          {model.conflicts.map((conflict) => (
            <div key={conflict.id} className="flex flex-wrap items-start gap-3 border-t border-border py-2.5 first:border-t-0">
              <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-accent text-accent-foreground"><Pencil className="size-4" /></span>
              <span className="flex min-w-0 flex-1 flex-col text-sm">
                <span className="font-semibold">{conflict.table} · {conflict.field}</span>
                <span className="break-words text-muted-foreground">{t("sync.yours")}: <code>{JSON.stringify(conflict.clientValue)}</code></span>
                <span className="break-words text-muted-foreground">{t("sync.kept")}: <code>{JSON.stringify(conflict.serverValue)}</code></span>
              </span>
              <Button size="sm" variant="ghost" onClick={() => model.dismissConflict(conflict.id)}>{t("sync.dismiss")}</Button>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
