import { useTranslation } from "react-i18next"
import { RefreshControl, ScrollView, View } from "react-native"

import { Button } from "@/components/button"
import { LinkRow } from "@/components/link-row"
import { Notice } from "@/components/notice"
import { Group } from "@/components/row"
import { Badge, Section } from "@/components/soft-kit"
import { ThemedText } from "@/components/themed-text"
import { makeStyles, spacing } from "@/theme"
import { StatusBadge } from "../thread"
import type { SupportScreenModel } from "../use-support-screen"

/** Soft: the explanation, one wide button for a new report, then the person's reports under their own heading. */
export function SupportSoft({ model }: { model: SupportScreenModel }) {
  const { t } = useTranslation()
  const styles = useStyles()
  return (
    <ScrollView style={styles.fill} contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={model.refreshing} onRefresh={model.refresh} />}>
      <ThemedText variant="subhead">{t("support.intro")}</ThemedText>
      <Button testID="report-new" size="lg" title={t("support.new")} onPress={model.create} />
      {model.error ? <Notice tone="error">{model.error}</Notice> : null}
      <Section title={t("support.yours")}>
        {model.loading ? <ThemedText variant="subhead">{t("common.loading")}</ThemedText> : null}
        {model.empty ? <ThemedText variant="subhead">{t("support.none")}</ThemedText> : null}
        {model.reports.length > 0 ? (
          <Group>
            {model.reports.map((report, index) => (
              <LinkRow key={report.id} testID={`report-${report.id}`} href={report.href} last={index === model.reports.length - 1} trailing={<StatusBadge status={report.status} />}>
                <ThemedText numberOfLines={1} style={report.unread ? styles.unread : null}>{report.subject}</ThemedText>
                <View style={styles.meta}>
                  {report.unread ? <Badge tone="info">{t("support.newReply")}</Badge> : null}
                  <ThemedText variant="caption">{report.detail}</ThemedText>
                </View>
              </LinkRow>
            ))}
          </Group>
        ) : null}
      </Section>
    </ScrollView>
  )
}

const useStyles = makeStyles((colors) => ({
  fill: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.md },
  meta: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: spacing.sm },
  unread: { fontWeight: "600" },
}))
