import { Stack } from "expo-router"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Alert, StyleSheet, View } from "react-native"

import { backupState, clearBackupPassphrase, createBackup, listBackups, NO_BACKUP, openBackup, setAutomaticBackup, setBackupPassphrase } from "@mizan/core/backup/store"
import { applyImport } from "@mizan/core/data/export"
import type { Attachment } from "@mizan/core/schema"
import { Button } from "@/components/button"
import { Notice } from "@/components/notice"
import { Group, Row } from "@/components/row"
import { Screen } from "@/components/screen"
import { TextField } from "@/components/text-field"
import { ThemedText } from "@/components/themed-text"
import { ToggleRow } from "@/components/toggle-row"
import { useLiveQuery, useSession } from "@/hooks/use-core"
import { spacing } from "@/theme"
import { describeError } from "@/utils/errors"

const MIN_PASSPHRASE = 8
const BYTES_PER_KB = 1024

type Asking = { kind: "set" } | { kind: "restore"; backup: Attachment } | null

/** FR-DAT-06: a daily encrypted copy on the server, opened only with a passphrase that never leaves the phone. */
export function BackupSettings() {
  const { t, i18n } = useTranslation()
  const session = useSession()
  const state = useLiveQuery(backupState, [], NO_BACKUP)
  const backups = useLiveQuery(listBackups, [], [])
  const [asking, setAsking] = useState<Asking>(null)
  const [passphrase, setPassphrase] = useState("")
  const [message, setMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const when = (at: string | number) => new Intl.DateTimeFormat(i18n.language === "ar" ? "ar-IQ-u-nu-latn" : "en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(at))

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
  return (
    <Screen>
      <Stack.Screen options={{ title: t("backup.title") }} />
      {message ? <Notice>{message}</Notice> : null}
      <ThemedText variant="subhead">{t("backup.body")}</ThemedText>

      {asking ? (
        <View style={styles.section}>
          <ThemedText variant="headline">{asking.kind === "set" ? t("backup.setPassphrase") : t("backup.restore")}</ThemedText>
          <ThemedText variant="caption">{asking.kind === "set" ? t("backup.passphraseHint") : t("backup.restoreHint")}</ThemedText>
          <TextField testID="backup-passphrase" label={t("backup.passphrase")} secureTextEntry autoComplete="off" autoCapitalize="none" value={passphrase} onChangeText={setPassphrase} autoFocus />
          <View style={styles.buttons}>
            <Button variant="secondary" title={t("common.cancel")} onPress={() => { setAsking(null); setPassphrase("") }} />
            <Button testID="backup-submit" title={asking.kind === "set" ? t("accounts.save") : t("backup.open")} loading={busy} disabled={!passphrase || tooShort} onPress={() => void submit()} />
          </View>
        </View>
      ) : !state.configured ? (
        <Button testID="backup-set" title={t("backup.setPassphrase")} onPress={() => setAsking({ kind: "set" })} />
      ) : (
        <View style={styles.section}>
          <Group>
            <Row last><ToggleRow testID="backup-auto" label={t("backup.automatic")} value={state.automatic} onChange={(on) => void setAutomaticBackup(on)} /></Row>
          </Group>
          <ThemedText variant="caption">{state.lastBackupAt ? t("backup.last", { at: when(state.lastBackupAt) }) : t("backup.never")}</ThemedText>
          <View style={styles.buttons}>
            <Button testID="backup-now" variant="secondary" title={t("backup.now")} onPress={() => void run(async () => session && createBackup(session), t("backup.queued"))} />
            <Button testID="backup-change" variant="secondary" title={t("backup.changePassphrase")} onPress={() => setAsking({ kind: "set" })} />
            <Button testID="backup-forget" variant="ghost" title={t("backup.forget")} onPress={() => void clearBackupPassphrase()} />
          </View>
        </View>
      )}

      {backups.length > 0 ? (
        <View style={styles.section}>
          <ThemedText variant="headline">{t("backup.list")}</ThemedText>
          <Group>
            {backups.map((b, index) => (
              <Row key={b.id} last={index === backups.length - 1} trailing={<Button testID={`restore-${b.id}`} variant="ghost" title={t("backup.restore")} onPress={() => setAsking({ kind: "restore", backup: b })} />}>
                <ThemedText>{b.uploadedAt ? when(b.uploadedAt) : t("backup.pendingUpload")}</ThemedText>
                <ThemedText variant="caption">{`${Math.round(b.byteSize / BYTES_PER_KB)} KB`}</ThemedText>
              </Row>
            ))}
          </Group>
        </View>
      ) : null}
    </Screen>
  )
}

const styles = StyleSheet.create({
  section: { gap: spacing.sm },
  buttons: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
})
