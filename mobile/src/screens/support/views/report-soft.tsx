import { useTranslation } from "react-i18next"
import { View } from "react-native"

import { Notice } from "@/components/notice"
import { Card } from "@/components/soft-kit"
import { ThemedText } from "@/components/themed-text"
import { makeStyles, spacing } from "@/theme"
import { ReplyForm, ReportThread, StatusBadge } from "../thread"
import type { ReportScreenModel } from "../use-report-screen"

/** Soft: a headline card with the subject, its state and kind, the conversation, then the reply in its own card. */
export function ReportSoft({ model }: { model: ReportScreenModel }) {
  const { t } = useTranslation()
  const styles = useStyles()
  const { report } = model
  return (
    <>
      {model.loading ? <ThemedText variant="subhead">{t("common.loading")}</ThemedText> : null}
      {report ? (
        <>
          <Card>
            <ThemedText variant="title" selectable style={styles.subject}>{report.subject}</ThemedText>
            <View style={styles.meta}>
              <StatusBadge status={report.status} />
              <ThemedText variant="subhead">{model.category}</ThemedText>
            </View>
          </Card>
          <ReportThread report={report} />
          <Card><ReplyForm onSend={model.send} hint={model.replyHint} /></Card>
        </>
      ) : null}
      {model.error ? <Notice tone="error">{model.error}</Notice> : null}
    </>
  )
}

const useStyles = makeStyles(() => ({
  subject: { writingDirection: "auto" },
  meta: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
}))
