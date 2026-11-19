import { router, Stack } from "expo-router"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"

import { acceptInvitation, previewInvitation } from "@mizan/core/auth/household"
import { Button } from "@/components/button"
import { Notice } from "@/components/notice"
import { Screen } from "@/components/screen"
import { ThemedText } from "@/components/themed-text"
import { describeError } from "@/utils/errors"

type Preview = Awaited<ReturnType<typeof previewInvitation>>

/** Where an invitation link lands: who invited you, to which household, as what. */
export function JoinHousehold({ token }: { token: string }) {
  const { t, i18n } = useTranslation()
  const [preview, setPreview] = useState<Preview | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const date = (iso: string) => new Intl.DateTimeFormat(i18n.language === "ar" ? "ar-IQ-u-nu-latn" : "en-GB", { dateStyle: "medium" }).format(new Date(iso))

  useEffect(() => {
    previewInvitation(token).then(setPreview).catch((e) => setError(describeError(e)))
  }, [token])

  async function join() {
    setBusy(true)
    try {
      await acceptInvitation(token)
      router.dismissTo("/")
    } catch (e) {
      setError(describeError(e))
      setBusy(false)
    }
  }

  return (
    <Screen sheet>
      <Stack.Screen options={{ title: t("household.joinTitle") }} />
      {error ? <Notice tone="error">{error}</Notice> : null}
      {preview ? (
        <>
          <ThemedText testID="join-preview">{t("household.joinBody", { household: preview.householdName, by: preview.invitedBy, role: t(`household.roles.${preview.role}`) })}</ThemedText>
          <ThemedText variant="caption">{t("household.expires", { date: date(preview.expiresAt) })}</ThemedText>
          <Button testID="confirm-join" title={t("household.join")} loading={busy} onPress={() => void join()} />
        </>
      ) : null}
    </Screen>
  )
}
