import { lazy } from "react"
import { useTranslation } from "react-i18next"

import { styleViews } from "@/app/style"
import { Field } from "@/components/Field"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { AssetSheet } from "./AssetSheet"
import { useAssetsPage, type AssetsPageModel } from "./useAssetsPage"

const AssetsView = styleViews<{ model: AssetsPageModel }>({
  soft: lazy(() => import("./views/AssetsSoft")),
})

export function AssetsPage() {
  const { t } = useTranslation()
  const model = useAssetsPage()
  const { action } = model
  return (
    <>
      <AssetsView model={model} />
      <AssetSheet open={model.editing !== null} asset={model.editing === "new" ? null : model.editing} onClose={() => model.setEditing(null)} onDelete={model.remove} />

      <Dialog open={action !== null} onOpenChange={(open) => !open && model.setAction(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{action ? `${t(action.kind === "value" ? "assets.addValuation" : "assets.sell")}: ${action.asset.name}` : ""}</DialogTitle></DialogHeader>
          <form onSubmit={model.submitAction} className="flex flex-col gap-4">
            <Field id="amount" label={action?.kind === "sell" ? t("assets.salePrice") : t("assets.value")}>
              <Input id="amount" inputMode="decimal" dir="ltr" value={model.amount} onChange={(e) => model.setAmount(e.target.value)} required autoFocus />
            </Field>
            <Field id="on" label={t("transactions.date")}>
              <Input id="on" type="date" dir="ltr" value={model.on} onChange={(e) => model.setOn(e.target.value)} required />
            </Field>
            {action?.kind === "value" && (
              <Field id="note" label={t("transactions.note")}>
                <Input id="note" value={model.note} onChange={(e) => model.setNote(e.target.value)} maxLength={120} />
              </Field>
            )}
            {action?.kind === "sell" && <p className="text-xs opacity-70">{t("assets.sellHint")}</p>}
            <DialogFooter><Button type="submit">{t("accounts.save")}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
