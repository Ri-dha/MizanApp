import { ArrowDown, Info } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Field } from "@/components/Field"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import type { MoveMoneyModel } from "../useMoveMoney"

const picker = "h-auto w-full justify-between gap-3 border-0 bg-transparent px-4 py-3 shadow-none"

/** Soft: where the money leaves and where it lands as one card with an arrow between, then the details. */
export default function MoveMoneySoft({ model }: { model: MoveMoneyModel }) {
  const { t } = useTranslation()
  const { money } = model

  return (
    <Sheet open={model.open} onOpenChange={(next) => !next && model.onClose()}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader><SheetTitle>{t("plan.move")}</SheetTitle></SheetHeader>
        <form onSubmit={model.submit} className="flex flex-col gap-3.5 px-4">
          <div className="rounded-xl border border-border bg-card py-1 shadow-card">
            <Select value={model.fromId} onValueChange={model.setFromId}>
              <SelectTrigger id="from" aria-label={t("transactions.fromBucket")} className={picker}>
                <span className="flex min-w-0 flex-col items-start">
                  <span className="text-xs text-muted-foreground">{t("transactions.fromBucket")}</span>
                  <SelectValue />
                </span>
              </SelectTrigger>
              <SelectContent>{model.buckets.map((b) => <SelectItem key={b.id} value={b.id}>{b.name} · {money(model.freeOf(b.id))}</SelectItem>)}</SelectContent>
            </Select>
            <div className="flex items-center gap-2.5 px-4" aria-hidden>
              <span className="h-px flex-1 bg-border" />
              <span className="grid size-8 place-items-center rounded-full bg-accent text-accent-foreground"><ArrowDown className="size-5" /></span>
              <span className="h-px flex-1 bg-border" />
            </div>
            <Select value={model.toId} onValueChange={model.setToId}>
              <SelectTrigger id="to" aria-label={t("transactions.to")} className={picker}>
                <span className="flex min-w-0 flex-col items-start">
                  <span className="text-xs text-muted-foreground">{t("transactions.to")}</span>
                  <SelectValue />
                </span>
              </SelectTrigger>
              <SelectContent>{model.buckets.filter((b) => b.id !== model.fromId).map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <Field id="amount" label={t("transactions.amount")}>
              <Input id="amount" inputMode="decimal" dir="ltr" value={model.amount} onChange={(e) => model.setAmount(e.target.value)} required autoFocus />
            </Field>
            <Field id="on" label={t("transactions.date")}>
              <Input id="on" type="date" dir="ltr" value={model.on} onChange={(e) => model.setOn(e.target.value)} required />
            </Field>
          </div>
          <Field id="reason" label={t("plan.reason")}>
            <Input id="reason" value={model.reason} onChange={(e) => model.setReason(e.target.value)} maxLength={120} placeholder={t("plan.reasonHint")} />
          </Field>
          <p className="flex items-start gap-2.5 rounded-lg border border-link/20 bg-info-soft px-3.5 py-2.5 text-[13px]"><Info className="size-5 shrink-0 text-link" />{t("plan.moveHint")}</p>
          <SheetFooter className="px-0"><Button type="submit" disabled={!model.canSubmit}>{t("plan.moveConfirm")}</Button></SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
