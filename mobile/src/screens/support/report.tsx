import { Stack } from "expo-router"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"

import { Notice } from "@/components/notice"
import { Screen } from "@/components/screen"
import { ThemedText } from "@/components/themed-text"
import { openReport, replyToReport, type ReportDetail } from "@/platform/support"
import { spacing } from "@/theme"
import { describeError } from "@/utils/errors"
import { ReplyForm, ReportThread, StatusBadge } from "./thread"

export function Report({ id }: { id: string }) {
  const { t } = useTranslation()
  const [report, setReport] = useState<ReportDetail | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let live = true
    openReport(id).then((opened) => live && setReport(opened)).catch((e) => live && setError(describeError(e)))
    return () => {
      live = false
    }
  }, [id])

  async function send(body: string, images: string[]) {
    try {
      setReport(await replyToReport(id, body, images))
      setError(null)
      return true
    } catch (e) {
      setError(describeError(e))
      return false
    }
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: report?.subject ?? t("support.title"), headerLargeTitle: false }} />
      {!report && !error ? <ThemedText variant="subhead">{t("common.loading")}</ThemedText> : null}
      {report ? (
        <>
          <View style={styles.heading}>
            <ThemedText variant="title" selectable style={styles.subject}>{report.subject}</ThemedText>
            <View style={styles.meta}>
              <StatusBadge status={report.status} />
              <ThemedText variant="subhead">{t(`support.category.${report.category}`)}</ThemedText>
            </View>
          </View>
          <ReportThread report={report} />
          <ReplyForm onSend={send} hint={report.status === "RESOLVED" ? t("support.reopenHint") : undefined} />
        </>
      ) : null}
      {error ? <Notice tone="error">{error}</Notice> : null}
    </Screen>
  )
}

const styles = StyleSheet.create({
  heading: { gap: spacing.sm },
  subject: { writingDirection: "auto" },
  meta: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
})
