import { Stack } from "expo-router"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"

import { formatMoney } from "@mizan/core/domain/money/format"
import { rowsBy } from "@mizan/core/store/store"
import { Button } from "@/components/button"
import { Group, Row } from "@/components/row"
import { Screen } from "@/components/screen"
import { ThemedText } from "@/components/themed-text"
import { useLiveQuery, useSession } from "@/hooks/use-core"
import { spacing } from "@/theme"
import { formatMonthKey } from "@/utils/month"

async function reportFor(year: number) {
  const [row] = await rowsBy("annualReports", "year", year, (r) => r.deletedAt === null)
  return row?.report ?? null
}

/** §4.2 P4: what an advisor sees, built by members' devices from shared records; never a transaction. */
export function Advisor() {
  const { t, i18n } = useTranslation()
  const session = useSession()
  const [year, setYear] = useState(new Date().getFullYear())
  const report = useLiveQuery(() => reportFor(year), [year], null)
  const money = (v: number) => formatMoney(v, report?.baseCurrency ?? "IQD", i18n.language)
  const rate = (v: number | null | undefined) => (v == null ? "—" : `${v}%`)

  return (
    <Screen>
      <Stack.Screen options={{ title: t("advisor.title", { household: session?.householdName ?? "" }) }} />
      <View style={styles.years}>
        <Button testID="advisor-previous" variant="secondary" title={String(year - 1)} onPress={() => setYear(year - 1)} />
        <Button testID="advisor-next" variant="secondary" title={String(year + 1)} onPress={() => setYear(year + 1)} />
      </View>
      <ThemedText variant="subhead">{t("advisor.body")}</ThemedText>
      {report ? (
        <>
          <View style={styles.section}>
            <ThemedText variant="headline">{t("report.yearTitle", { year })}</ThemedText>
            <ThemedText variant="caption">{t("report.savingRateDefinition")}</ThemedText>
            <Group>
              <Row trailing={<ThemedText>{money(report.received ?? 0)}</ThemedText>}><ThemedText>{t("income.received")}</ThemedText></Row>
              <Row trailing={<ThemedText>{money(report.spent ?? 0)}</ThemedText>}><ThemedText>{t("plan.spent")}</ThemedText></Row>
              <Row last trailing={<ThemedText>{rate(report.savingRate)}</ThemedText>}><ThemedText>{t("report.rate")}</ThemedText></Row>
            </Group>
          </View>
          <View style={styles.section}>
            <ThemedText variant="headline">{t("report.months")}</ThemedText>
            <Group>
              {(report.months ?? []).map((m, index, months) => {
                const snapshot = (report.snapshots ?? []).find((s) => s.monthKey === m.monthKey)
                return (
                  <Row key={m.monthKey} last={index === months.length - 1} trailing={<ThemedText>{money(m.saved ?? 0)}</ThemedText>}>
                    <ThemedText>{formatMonthKey(m.monthKey ?? "", i18n.language)}</ThemedText>
                    <ThemedText variant="caption">
                      {`${t("income.received")} ${money(m.received ?? 0)} · ${t("plan.spent")} ${money(m.spent ?? 0)} · ${rate(m.savingRate)} · ${t("networth.title")} ${snapshot ? money(snapshot.netWorth ?? 0) : "—"}`}
                    </ThemedText>
                  </Row>
                )
              })}
            </Group>
          </View>
        </>
      ) : (
        <ThemedText testID="advisor-empty" variant="subhead">{t("advisor.noReport")}</ThemedText>
      )}
    </Screen>
  )
}

const styles = StyleSheet.create({
  section: { gap: spacing.sm },
  years: { flexDirection: "row", gap: spacing.sm },
})
