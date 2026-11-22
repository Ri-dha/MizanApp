import { router, Stack, useFocusEffect } from "expo-router"
import { useCallback, useState } from "react"
import { useTranslation } from "react-i18next"
import { RefreshControl, ScrollView, View } from "react-native"

import { Button } from "@/components/button"
import { LinkRow } from "@/components/link-row"
import { Notice } from "@/components/notice"
import { Group } from "@/components/row"
import { ThemedText } from "@/components/themed-text"
import { myReports, type ReportSummary } from "@/platform/support"
import { spacing, useBrandColors, makeStyles } from "@/theme"
import { describeError } from "@/utils/errors"
import { StatusBadge, useWhen } from "./thread"

/** The person's reports, newest activity first; a reply from the team marks its report until it is opened. */
export function Support() {
  const styles = useStyles()
  const { t } = useTranslation()
  const brand = useBrandColors()
  const when = useWhen()
  const [reports, setReports] = useState<ReportSummary[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    try {
      setReports(await myReports())
      setError(null)
    } catch (e) {
      setError(describeError(e))
    }
  }, [])

  useFocusEffect(useCallback(() => void load(), [load]))

  async function refresh() {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }

  return (
    <ScrollView
      style={styles.fill}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void refresh()} />}
    >
      <Stack.Screen options={{ title: t("support.title") }} />
      <ThemedText variant="subhead">{t("support.intro")}</ThemedText>
      <Button testID="report-new" title={t("support.new")} onPress={() => router.push("/support-new")} />
      {error ? <Notice tone="error">{error}</Notice> : null}
      {!reports && !error ? <ThemedText variant="subhead">{t("common.loading")}</ThemedText> : null}
      {reports?.length === 0 ? <ThemedText variant="subhead">{t("support.none")}</ThemedText> : null}
      {reports && reports.length > 0 ? (
        <Group>
          {reports.map((report, index) => (
            <LinkRow
              key={report.id}
              testID={`report-${report.id}`}
              href={{ pathname: "/support-report", params: { id: report.id } }}
              last={index === reports.length - 1}
              trailing={<StatusBadge status={report.status} />}
            >
              <ThemedText numberOfLines={1} style={report.unread ? styles.unread : null}>{report.subject}</ThemedText>
              <View style={styles.meta}>
                {report.unread ? <ThemedText variant="caption" style={{ color: brand.primary }}>{t("support.newReply")}</ThemedText> : null}
                <ThemedText variant="caption">{`${t(`support.category.${report.category}`)} · ${when(report.lastMessageAt)}`}</ThemedText>
              </View>
            </LinkRow>
          ))}
        </Group>
      ) : null}
    </ScrollView>
  )
}

const useStyles = makeStyles((colors) => ({
  fill: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.md },
  meta: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  unread: { fontWeight: "600" },
}))
