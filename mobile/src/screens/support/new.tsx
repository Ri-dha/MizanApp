import { router, Stack } from "expo-router"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"

import { Button } from "@/components/button"
import { Chips } from "@/components/chips"
import { Notice } from "@/components/notice"
import { Screen } from "@/components/screen"
import { TextField } from "@/components/text-field"
import { ThemedText } from "@/components/themed-text"
import { REPORT_CATEGORIES, sendReport, type ReportCategory } from "@/platform/support"
import { spacing } from "@/theme"
import { describeError } from "@/utils/errors"
import { ImagesField } from "./images"
import { MAX_BODY } from "./thread"

const MAX_SUBJECT = 120

export function NewReport() {
  const { t } = useTranslation()
  const [category, setCategory] = useState<ReportCategory>("PROBLEM")
  const [subject, setSubject] = useState("")
  const [body, setBody] = useState("")
  const [images, setImages] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function send() {
    setBusy(true)
    setError(null)
    try {
      const report = await sendReport({ category, subject: subject.trim(), body: body.trim() }, images)
      router.replace({ pathname: "/support-report", params: { id: report.id } })
    } catch (e) {
      setError(describeError(e))
      setBusy(false)
    }
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: t("support.new") }} />
      <Notice>{t("support.privacy")}</Notice>
      <View style={styles.field}>
        <ThemedText variant="subhead">{t("support.categoryLabel")}</ThemedText>
        <Chips
          testID="report-category"
          options={REPORT_CATEGORIES.map((c) => ({ value: c, label: t(`support.category.${c}`) }))}
          value={category}
          onChange={(value) => value && setCategory(value as ReportCategory)}
        />
      </View>
      <TextField testID="report-subject" label={t("support.subject")} maxLength={MAX_SUBJECT} value={subject} onChangeText={setSubject} editable={!busy} />
      <View style={styles.field}>
        <TextField testID="report-body" label={t("support.body")} multiline maxLength={MAX_BODY} value={body} onChangeText={setBody} editable={!busy} style={styles.multiline} />
        <ThemedText variant="caption">{t("support.bodyHint")}</ThemedText>
      </View>
      <ImagesField images={images} onChange={setImages} disabled={busy} />
      {error ? <Notice tone="error">{error}</Notice> : null}
      <Button testID="report-send" title={busy ? t("support.sending") : t("support.send")} loading={busy} disabled={!subject.trim() || !body.trim()} onPress={() => void send()} />
    </Screen>
  )
}

const styles = StyleSheet.create({
  field: { gap: spacing.xs },
  multiline: { minHeight: 140, textAlignVertical: "top" },
})
