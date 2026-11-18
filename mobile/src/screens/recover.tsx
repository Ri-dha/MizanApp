import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"

import { logout } from "@mizan/core/auth/session"
import { previewStartOver, recoverWithCode, startOver, type ResetPreview } from "@mizan/core/vault/account"
import { Button } from "@/components/button"
import { Notice } from "@/components/notice"
import { Screen } from "@/components/screen"
import { TextField } from "@/components/text-field"
import { ThemedText } from "@/components/themed-text"
import { type } from "@/theme"
import { describeError } from "@/utils/errors"

/** After a password reset the new password cannot open the old keys; the recovery code can. */
export function Recover() {
  const { t } = useTranslation()
  const [code, setCode] = useState("")
  const [wrong, setWrong] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [startingOver, setStartingOver] = useState(false)

  async function submit() {
    setBusy(true)
    setError(null)
    try {
      setWrong(!(await recoverWithCode(code)))
    } catch (e) {
      setError(describeError(e))
    } finally {
      setBusy(false)
    }
  }

  if (startingOver) return <StartOver onBack={() => setStartingOver(false)} />
  return (
    <Screen centered>
      <ThemedText variant="title">{t("vault.recoverTitle")}</ThemedText>
      <ThemedText variant="subhead">{t("vault.recoverBody")}</ThemedText>
      <TextField testID="recovery-input" label={t("vault.recoveryCode")} autoCapitalize="characters" autoCorrect={false} style={type.code} value={code} onChangeText={setCode} />
      {wrong ? <Notice tone="error" testID="recover-failed">{t("vault.recoverFailed")}</Notice> : null}
      {error ? <Notice tone="error">{error}</Notice> : null}
      <Button testID="recover" size="lg" title={t("vault.recover")} loading={busy} disabled={!code} onPress={() => void submit()} />
      <ThemedText variant="subhead">{t("vault.otherDevice")}</ThemedText>
      <Button testID="no-code" variant="ghost" title={t("vault.noCode")} onPress={() => setStartingOver(true)} />
      <Button variant="secondary" title={t("auth.logout")} onPress={() => void logout()} />
    </Screen>
  )
}

/** ADR e2e-3: says exactly what will be lost, from the server's own count, before anything is removed. */
function StartOver({ onBack }: { onBack: () => void }) {
  const { t } = useTranslation()
  const [preview, setPreview] = useState<ResetPreview | null>(null)
  const [typed, setTyped] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const word = t("vault.startOverWord")
  const confirmed = typed.trim().toLocaleUpperCase() === word.toLocaleUpperCase()
  const sole = (preview?.households ?? []).filter((h) => h.soleKeyHolder)

  useEffect(() => {
    previewStartOver().then(setPreview).catch((e: unknown) => setError(describeError(e)))
  }, [])

  async function confirm() {
    setBusy(true)
    try {
      await startOver()
    } catch (e) {
      setError(describeError(e))
      setBusy(false)
    }
  }

  return (
    <Screen centered>
      <ThemedText variant="title">{t("vault.startOverTitle")}</ThemedText>
      <ThemedText variant="subhead">{t("vault.startOverBody")}</ThemedText>
      {!preview ? (
        <ThemedText variant="subhead">{t("common.loading")}</ThemedText>
      ) : (
        <>
          <Notice tone="error" testID="start-over-preview">
            {[
              t("vault.startOverPrivate", { count: preview.privateRecords ?? 0 }),
              ...sole.map((h) => t("vault.startOverShared", { name: h.name, count: h.sharedRecordsLost ?? 0 })),
              ...(sole.length === 0 ? [t("vault.startOverKept")] : []),
            ].join("\n")}
          </Notice>
          <TextField testID="start-over-word" label={t("vault.startOverType", { word })} autoCapitalize="characters" autoCorrect={false} value={typed} onChangeText={setTyped} />
          <Button testID="start-over" variant="destructive" size="lg" title={t("vault.startOverConfirm")} loading={busy} disabled={!confirmed} onPress={() => void confirm()} />
        </>
      )}
      {error ? <Notice tone="error">{error}</Notice> : null}
      <Button variant="secondary" title={t("vault.startOverBack")} onPress={onBack} />
    </Screen>
  )
}
