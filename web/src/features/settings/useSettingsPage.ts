import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { EXPORT_COLUMNS, exportTableFor } from "@mizan/core/data/exportTables"
import { META_KEYS, readMeta, writeMeta } from "@mizan/core/db/meta"
import { mayWriteRecords } from "@mizan/core/roles"
import { cancelAccountDeletion, logout, requestAccountDeletion, useSession } from "@/api/auth"
import { useAppMode } from "@/app/appMode"
import { describeError } from "@/app/errors"
import { usePreferences } from "@/app/preferences"
import { useTheme } from "@/app/theme"
import { clearBackupPassphrase, createBackup, openBackup, setAutomaticBackup, setBackupPassphrase, useBackupState, useBackups } from "@/backup/store"
import { applyImport, buildExport, downloadJson, ImportError, validateImport, type ImportPreview } from "@/data/export"
import { downloadBlob, toCsv, toXlsx } from "@/data/tabular"
import { useNotificationSettings } from "@/db/notifications"
import { usePrivacyDefaults } from "@/db/privacy"
import type { Attachment } from "@/db/schema"
import { clearLock, currentDataKey, DEFAULT_LOCK_AFTER_SECONDS, useLockState } from "@/lock/store"
import { enrollWebAuthn, hasWebAuthnUnlock, removeWebAuthn, webAuthnAvailable } from "@/lock/webauthn"
import { disablePush, enablePush, pushState, sendTestPush, type PushState } from "@/notifications/push"
import { resetSyncState } from "@/sync/engine"
import { forgetAllTours } from "@/tours/store"
import { useScreenTour } from "@/tours/useTour"

export type ExportKind = "transactions" | "metals" | "assets"
export type PassphraseDialog = "set" | { restore: Attachment } | null

export function useSettingsPage() {
  const { t, i18n } = useTranslation()
  const session = useSession()
  // §4.2: an advisor has no records, Home or reminders; a viewer cannot write records.
  const advisor = session?.role === "ADVISOR"
  const writes = mayWriteRecords(session?.role ?? "OWNER")
  const theme = useTheme()
  const mode = useAppMode()
  const restricted = advisor || session?.role === "DEPENDENT"
  const lockState = useLockState()
  const [lockAfter, setLockAfterValue] = useState(DEFAULT_LOCK_AFTER_SECONDS)
  const [biometricsAvailable, setBiometricsAvailable] = useState(false)
  const [biometricsOn, setBiometricsOn] = useState(false)
  const privacy = usePrivacyDefaults()
  const notify = useNotificationSettings()
  const backup = useBackupState()
  const backups = useBackups()
  const prefs = usePreferences()
  const [passphrase, setPassphrase] = useState("")
  const [passphraseDialog, setPassphraseDialog] = useState<PassphraseDialog>(null)
  const [push, setPush] = useState<PushState>("unsupported")
  const [preview, setPreview] = useState<ImportPreview | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)
  const csvInput = useRef<HTMLInputElement>(null)
  const [csvFile, setCsvFile] = useState<File | null>(null)
  useScreenTour("settings")

  useEffect(() => {
    void pushState().then(setPush)
  }, [])

  useEffect(() => {
    void readMeta<number>(META_KEYS.lockAfterSeconds).then((value) => value !== undefined && setLockAfterValue(value))
    void webAuthnAvailable().then(setBiometricsAvailable)
    void hasWebAuthnUnlock().then(setBiometricsOn)
  }, [])

  function setLockAfter(seconds: number) {
    setLockAfterValue(seconds)
    void writeMeta(META_KEYS.lockAfterSeconds, seconds)
  }

  async function submitPassphrase() {
    try {
      if (passphraseDialog === "set") {
        await setBackupPassphrase(passphrase)
        await setAutomaticBackup(true)
        toast(t("backup.passphraseSet"))
      } else if (passphraseDialog) {
        setPreview(await openBackup(passphraseDialog.restore, passphrase))
      }
      setPassphraseDialog(null)
      setPassphrase("")
    } catch (e) {
      toast(e instanceof Error && e.message === "WRONG_PASSPHRASE" ? t("backup.wrongPassphrase") : describeError(e))
    }
  }

  async function backupNow() {
    if (!session) return
    try {
      await createBackup(session)
      toast(t("backup.queued"))
    } catch (e) {
      toast(describeError(e))
    }
  }

  async function exportTable(kind: ExportKind, format: "csv" | "xlsx") {
    const table = await exportTableFor(kind, EXPORT_COLUMNS[kind].map((k) => t(`exports.columns.${k}`)))
    const stamp = new Date().toISOString().slice(0, 10)
    if (format === "csv") downloadBlob(`mizan-${kind}-${stamp}.csv`, new Blob([toCsv(table)], { type: "text/csv;charset=utf-8" }))
    else downloadBlob(`mizan-${kind}-${stamp}.xlsx`, new Blob([toXlsx(table, t(`exports.${kind}`), i18n.language === "ar")], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }))
  }

  async function togglePush(on: boolean) {
    try {
      setPush(on ? await enablePush() : await disablePush())
    } catch (e) {
      toast(describeError(e))
    }
  }

  function testPush() {
    void sendTestPush().then((n) => toast(t("notifications.testSent", { count: n }))).catch((e) => toast(describeError(e)))
  }

  // Biometrics wrap the same data key the PIN unlocks, so enrolling needs the app unlocked, which Settings always is.
  async function toggleBiometrics(on: boolean) {
    if (!on) {
      await removeWebAuthn()
      setBiometricsOn(false)
      toast(t("lock.biometricsRemoved"))
      return
    }
    const key = currentDataKey()
    if (!key || !session) return
    try {
      const enrolled = await enrollWebAuthn(key, session.userId, session.displayName)
      setBiometricsOn(enrolled)
      toast(enrolled ? t("lock.biometricsEnabled") : t("lock.biometricsUnsupported"))
    } catch (e) {
      toast(describeError(e))
    }
  }

  async function exportData() {
    if (!session) return
    downloadJson(`mizan-${session.householdName.replace(/\s+/g, "-")}-${new Date().toISOString().slice(0, 10)}.json`, await buildExport(session))
  }

  async function pickImport(file: File | undefined) {
    if (!file) return
    try {
      setPreview(validateImport(JSON.parse(await file.text())))
    } catch (e) {
      toast(e instanceof ImportError ? t("data.invalid", { reason: e.message }) : t("data.notJson"))
    } finally {
      if (fileInput.current) fileInput.current.value = ""
    }
  }

  async function confirmImport() {
    if (!preview) return
    const written = await applyImport(preview)
    setPreview(null)
    toast(t("data.imported", { count: written }))
  }

  async function deleteAccount() {
    try {
      await requestAccountDeletion()
      setConfirmDelete(false)
      toast(t("account.deletionRequested"))
    } catch (e) {
      toast(describeError(e))
    }
  }

  function cancelDeletion() {
    void cancelAccountDeletion().then(() => toast(t("account.deletionCancelled")))
  }

  async function signOut() {
    await clearLock()
    await resetSyncState()
    await logout()
  }

  function replayTours() {
    forgetAllTours()
    toast(t("tours.replayed"))
  }

  const model = {
    session, advisor, writes, restricted, mode, theme, prefs, language: i18n.language, changeLanguage: (locale: string) => void i18n.changeLanguage(locale),
    lockState, lockAfter, setLockAfter, biometricsAvailable, biometricsOn, toggleBiometrics,
    privacy, notify, push, togglePush, testPush,
    backup, backups, backupNow, forgetPassphrase: () => void clearBackupPassphrase(), setAutomatic: (on: boolean) => void setAutomaticBackup(on),
    passphrase, setPassphrase, passphraseDialog, setPassphraseDialog, submitPassphrase,
    exportData, exportTable, pickImport, csvFile, setCsvFile,
    openImport: () => fileInput.current?.click(), openCsvImport: () => csvInput.current?.click(),
    preview, setPreview, confirmImport,
    confirmDelete, setConfirmDelete, deleteAccount, cancelDeletion,
    signOut, replayTours,
  }
  // The file inputs travel apart from the model, so views never hold a ref.
  return { model, fileInput, csvInput }
}

export type SettingsPageModel = ReturnType<typeof useSettingsPage>["model"]
