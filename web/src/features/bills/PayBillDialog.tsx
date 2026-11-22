import { useTranslation } from "react-i18next"

import { Field } from "@/components/Field"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { NO_ACCOUNT, type BillsPageModel } from "./useBillsPage"

/** Marking a bill paid asks the same three things in every template, so the dialog is shared. */
export function PayBillDialog({ model }: { model: BillsPageModel }) {
  const { t } = useTranslation()
  const { paying } = model
  return (
    <Dialog open={paying !== null} onOpenChange={(open) => !open && model.cancelPaying()}>
      <DialogContent>
        <DialogHeader><DialogTitle>{t("bills.markPaid")}: {paying?.expense.name}</DialogTitle></DialogHeader>
        <form onSubmit={model.confirmPaid} className="flex flex-col gap-4">
          <Field id="actual" label={t("bills.actualAmount")} hint={paying?.expense.isEstimate ? t("bills.estimateHint", { amount: model.money(paying.expectedAmount) }) : undefined}>
            <Input id="actual" inputMode="decimal" dir="ltr" value={model.actual} onChange={(e) => model.setActual(e.target.value)} required />
          </Field>
          {model.accounts.length > 0 && (
            <Field id="paidFrom" label={t("cashMovements.paidFrom")} hint={t("cashMovements.accountHint")}>
              <Select value={model.paidFrom} onValueChange={model.setPaidFrom}>
                <SelectTrigger id="paidFrom"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_ACCOUNT}>{t("cashMovements.noAccount")}</SelectItem>
                  {model.accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.name} ({a.currency})</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
          )}
          <Field id="paidOn" label={t("bills.paidOnLabel")}>
            <Input id="paidOn" type="date" dir="ltr" value={model.paidOn} onChange={(e) => model.setPaidOn(e.target.value)} required />
          </Field>
          <DialogFooter><Button type="submit">{t("accounts.save")}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
