import { lazy } from "react"
import { useTranslation } from "react-i18next"

import { styleViews } from "@/app/style"
import { Field } from "@/components/Field"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { GoalSheet } from "./GoalSheet"
import { useGoalsPage, type GoalsPageModel } from "./useGoalsPage"

const GoalsView = styleViews<{ model: GoalsPageModel }>({
  soft: lazy(() => import("./views/GoalsSoft")),
})

export function GoalsPage() {
  const { t } = useTranslation()
  const model = useGoalsPage()
  const { depositing } = model
  return (
    <>
      <GoalsView model={model} />
      <GoalSheet open={model.editing !== null} goal={model.editing === "new" ? null : model.editing} onClose={() => model.setEditing(null)} />

      <Dialog open={depositing !== null} onOpenChange={(open) => !open && model.setDepositing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{depositing ? t(`goals.${depositing.direction === "DEPOSIT" ? "deposit" : "withdraw"}`) : ""}: {depositing?.goal.name}</DialogTitle></DialogHeader>
          <form onSubmit={model.submitDeposit} className="flex flex-col gap-4">
            <Field id="amount" label={t("income.amount")}>
              <Input id="amount" inputMode="decimal" dir="ltr" value={model.amount} onChange={(e) => model.setAmount(e.target.value)} required autoFocus />
            </Field>
            <Field id="on" label={t("transactions.date")}>
              <Input id="on" type="date" dir="ltr" value={model.on} onChange={(e) => model.setOn(e.target.value)} required />
            </Field>
            <DialogFooter><Button type="submit">{t("accounts.save")}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
