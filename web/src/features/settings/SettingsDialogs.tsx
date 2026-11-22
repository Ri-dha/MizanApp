import type { RefObject } from "react"
import { useTranslation } from "react-i18next"

import { Field } from "@/components/Field"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { CsvImportDialog } from "./CsvImportDialog"
import type { SettingsPageModel } from "./useSettingsPage"

/** The file pickers and dialogs Settings opens; every template shares them. */
export function SettingsDialogs({ model, fileInput, csvInput }: { model: SettingsPageModel; fileInput: RefObject<HTMLInputElement | null>; csvInput: RefObject<HTMLInputElement | null> }) {
  const { t } = useTranslation()
  const { passphraseDialog, preview } = model
  return (
    <>
      <input ref={fileInput} type="file" accept="application/json,.json" hidden onChange={(e) => void model.pickImport(e.target.files?.[0])} />
      <input ref={csvInput} type="file" accept="text/csv,.csv" hidden onChange={(e) => { model.setCsvFile(e.target.files?.[0] ?? null); e.target.value = "" }} />

      <Dialog open={passphraseDialog !== null} onOpenChange={(open) => !open && model.setPassphraseDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{passphraseDialog === "set" ? t("backup.setPassphrase") : t("backup.restore")}</DialogTitle>
            <DialogDescription>{passphraseDialog === "set" ? t("backup.passphraseHint") : t("backup.restoreHint")}</DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); void model.submitPassphrase() }} className="flex flex-col gap-4">
            <Field id="passphrase" label={t("backup.passphrase")}>
              <Input id="passphrase" type="password" value={model.passphrase} onChange={(e) => model.setPassphrase(e.target.value)} required minLength={passphraseDialog === "set" ? 8 : 1} autoComplete="off" />
            </Field>
            <DialogFooter><Button type="submit">{passphraseDialog === "set" ? t("accounts.save") : t("backup.open")}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={preview !== null} onOpenChange={(open) => !open && model.setPreview(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("data.previewTitle")}</DialogTitle>
            <DialogDescription>{t("data.previewBody")}</DialogDescription>
          </DialogHeader>
          <ul className="text-sm">
            {preview && Object.entries(preview.counts).map(([table, count]) => <li key={table}>{t(`sync.tables.${table}`, { defaultValue: table })}: {count}</li>)}
            {preview && preview.skipped.length > 0 && <li className="opacity-70">{t("data.skipped", { tables: preview.skipped.map((table) => t(`sync.tables.${table}`, { defaultValue: table })).join(", ") })}</li>}
          </ul>
          <DialogFooter>
            <Button variant="outline" onClick={() => model.setPreview(null)}>{t("common.cancel")}</Button>
            <Button onClick={() => void model.confirmImport()}>{t("data.confirmImport")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={model.confirmDelete} onOpenChange={model.setConfirmDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("account.delete")}</DialogTitle>
            <DialogDescription>{t("account.deleteBody")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => void model.exportData()}>{t("data.export")}</Button>
            <Button onClick={() => void model.deleteAccount()}>{t("account.confirmDelete")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <CsvImportDialog file={model.csvFile} onClose={() => model.setCsvFile(null)} />
    </>
  )
}
