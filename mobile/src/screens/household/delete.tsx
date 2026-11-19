import { router, Stack } from "expo-router"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import { requestHouseholdDeletion } from "@mizan/core/auth/household"
import { updateHousehold } from "@mizan/core/auth/session"
import { Button } from "@/components/button"
import { Notice } from "@/components/notice"
import { Screen } from "@/components/screen"
import { TextField } from "@/components/text-field"
import { ThemedText } from "@/components/themed-text"
import { describeError } from "@/utils/errors"

/** The password re-proves who is asking; the household goes only after the grace period. */
export function DeleteHousehold() {
  const { t } = useTranslation()
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function confirm() {
    setBusy(true)
    try {
      await requestHouseholdDeletion(password)
      await updateHousehold({})
      router.back()
    } catch (e) {
      setError(describeError(e))
      setBusy(false)
    }
  }

  return (
    <Screen sheet>
      <Stack.Screen options={{ title: t("household.deleteTitle") }} />
      <ThemedText variant="subhead">{t("household.deleteConfirm")}</ThemedText>
      {error ? <Notice tone="error">{error}</Notice> : null}
      <TextField testID="delete-household-password" label={t("auth.password")} secureTextEntry autoComplete="current-password" value={password} onChangeText={setPassword} />
      <Button testID="confirm-delete-household" variant="destructive" title={t("household.delete")} loading={busy} disabled={!password} onPress={() => void confirm()} />
    </Screen>
  )
}
