import { useTranslation } from "react-i18next"

import { Field } from "@/components/Field"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import type { HouseholdPageModel } from "./useHouseholdPage"

/** Deleting a household asks for the password again; every template shares the dialog. */
export function DeleteHouseholdDialog({ model }: { model: HouseholdPageModel }) {
  const { t } = useTranslation()
  return (
    <Dialog open={model.confirmDelete} onOpenChange={model.setConfirmDelete}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("household.deleteTitle")}</DialogTitle>
          <DialogDescription>{t("household.deleteConfirm")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={model.submitDelete} className="flex flex-col gap-4">
          <Field id="password" label={t("auth.password")}>
            <Input id="password" type="password" value={model.password} onChange={(e) => model.setPassword(e.target.value)} required autoComplete="current-password" />
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => model.setConfirmDelete(false)}>{t("common.cancel")}</Button>
            <Button type="submit">{t("household.delete")}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
