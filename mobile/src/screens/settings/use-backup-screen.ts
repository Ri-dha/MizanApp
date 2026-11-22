import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Alert } from "react-native"

import { backupState, clearBackupPassphrase, createBackup, listBackups, NO_BACKUP, openBackup, setAutomaticBackup, setBackupPassphrase } from "@mizan/core/backup/store"
import { applyImport } from "@mizan/core/data/export"
import type { Attachment } from "@mizan/core/schema"
import { useLiveQuery, useSession } from "@/hooks/use-core"
import { formatWhen } from "@/utils/dates"
import { describeError } from "@/utils/errors"

const MIN_PASSPHRASE = 8
const BYTES_PER_KB = 1024

type Asking = { kind: "set" } | { kind: "restore"; backup: Attachment } | null

/** FR-DAT-06: a daily encrypted copy on the server, opened only with a passphrase that never leaves the phone. */
export function useBackupScreen() {
  const { t, i18n } = useTranslation()
  const session = useSession()
  const state = useLiveQuery(backupState, [], NO_BACKUP)
  const backups = useLiveQuery(listBackups, [], [])
  const [asking, setAsking] = useState<Asking>(null)
  const [passphrase, setPassphrase] = useState("")
  const [message, setMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const when = (at: string | number) => formatWhen(at, i18n.language)

  async function run(action: () => Promise<unknown>, done?: string) {
    try {
      await action()
      if (done) setMessage(done)
    } catch (e) {
      setMessage(describeError(e))
    }
  }

  async function submit() {
    if (!asking) return
    setBusy(true)
    try {
      if (asking.kind === "set") {
        await setBackupPassphrase(passphrase)
        await setAutomaticBackup(true)
        setMessage(t("backup.passphraseSet"))
      } else {
        const preview = await openBackup(asking.backup, passphrase)
        const lines = Object.entries(preview.counts).map(([table, count]) => `${table}: ${count}`).join("\n")
        Alert.alert(t("data.previewTitle"), `${t("data.previewBody")}\n\n${lines}`, [
          { text: t("common.cancel"), style: "cancel" },
          { text: t("data.confirmImport"), onPress: () => void run(async () => setMessage(t("data.imported", { count: await applyImport(preview) }))) },
        ])
      }
      setAsking(null)
      setPassphrase("")
    } catch (e) {
      setMessage(e instanceof Error && e.message === "WRONG_PASSPHRASE" ? t("backup.wrongPassphrase") : describeError(e))
    } finally {
      setBusy(false)
    }
  }

  const tooShort = asking?.kind === "set" && passphrase.length < MIN_PASSPHRASE
  return {
    message, busy, passphrase, setPassphrase,
    asking: asking?.kind ?? null,
    configured: state.configured,
    automatic: state.automatic,
    setAutomatic: (on: boolean) => void setAutomaticBackup(on),
    lastLine: state.lastBackupAt ? t("backup.last", { at: when(state.lastBackupAt) }) : t("backup.never"),
    canSubmit: !!passphrase && !tooShort,
    submit: () => void submit(),
    cancel: () => { setAsking(null); setPassphrase("") },
    askSet: () => setAsking({ kind: "set" }),
    backUpNow: () => void run(async () => session && createBackup(session), t("backup.queued")),
    forget: () => void clearBackupPassphrase(),
    backups: backups.map((backup) => ({
      id: backup.id,
      when: backup.uploadedAt ? when(backup.uploadedAt) : t("backup.pendingUpload"),
      size: `${Math.round(backup.byteSize / BYTES_PER_KB)} KB`,
      restore: () => setAsking({ kind: "restore", backup }),
    })),
  }
}

export type BackupScreenModel = ReturnType<typeof useBackupScreen>
