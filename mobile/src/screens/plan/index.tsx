import { Link, Stack, router } from "expo-router"
import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"

import { undoMove } from "@mizan/core/db/plan"
import { basisPointsToPercent } from "@mizan/core/domain/plan/figures"
import { formatMoney } from "@/utils/money"
import { Button } from "@/components/button"
import { MonthSwitcher } from "@/components/month-switcher"
import { Notice } from "@/components/notice"
import { Group, Row } from "@/components/row"
import { Screen } from "@/components/screen"
import { ThemedText } from "@/components/themed-text"
import { useSession } from "@/hooks/use-core"
import { useSelectedMonth } from "@/hooks/use-selected-month"
import { useMonthView } from "@/hooks/use-views"
import { colors, radius, spacing, type, useBrandColors } from "@/theme"
import { formatDay } from "@/utils/dates"
import { useScreenTour } from "@/tours"

const DAY: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" }

export function Plan() {
  const { t, i18n } = useTranslation()
  const brand = useBrandColors()
  const session = useSession()
  const startDay = session?.monthStartDay ?? 1
  const currency = session?.baseCurrency ?? "IQD"
  const [monthKey, setMonthKey] = useSelectedMonth(startDay)
  const view = useMonthView(monthKey, startDay)
  const money = (amount: number) => formatMoney(amount, currency, i18n.language)
  const nameOf = (id: string) => view.buckets.find((b) => b.id === id)?.name ?? "?"

  useScreenTour("plan", view.buckets.length > 0)
  return (
    <Screen>
      <Stack.Screen
        options={{
          title: t("plan.title"),
          headerRight: () => (
            <Link href={{ pathname: "/plan-buckets", params: { monthKey } }} asChild>
              <Button testID="edit-buckets" variant="ghost" title={t("plan.buckets")} />
            </Link>
          ),
        }}
      />
      <MonthSwitcher monthKey={monthKey} onChange={setMonthKey} />
      <ThemedText variant="subhead">{`${t("income.planned")}: ${money(view.income.planned)} · ${t("income.received")}: ${money(view.income.received)}`}</ThemedText>

      <Group>
        {view.figures.buckets.length === 0 ? <Row last><ThemedText variant="subhead">{t("plan.noBuckets")}</ThemedText></Row> : null}
        {view.figures.buckets.map((figure, index) => {
          const bucket = view.buckets.find((b) => b.id === figure.id)
          return (
            <Row
              key={figure.id}
              testID={`plan-bucket-${figure.id}`}
              last={index === view.figures.buckets.length - 1}
              trailing={
                <View style={styles.free}>
                  <ThemedText style={[type.amount, figure.free < 0 ? { color: brand.destructive } : null]}>{money(figure.free)}</ThemedText>
                  <ThemedText variant="caption">{t("plan.free")}</ThemedText>
                </View>
              }
            >
              <View style={styles.name}>
                <View style={[styles.swatch, { backgroundColor: bucket?.colour ?? colors.fill }]} />
                <ThemedText variant="headline">{bucket?.name ?? "—"}</ThemedText>
                <ThemedText variant="caption">{bucket && bucket.fixedAmount === null ? `${basisPointsToPercent(bucket.shareBasisPoints)}%` : ""}</ThemedText>
              </View>
              <ThemedText variant="caption">
                {[
                  `${t("plan.allocated")} ${money(figure.allocated)}`,
                  figure.carriedIn > 0 ? t("plan.carriedIn", { amount: money(figure.carriedIn) }) : null,
                  `${t("plan.committed")} ${money(figure.committed)}`,
                  `${t("plan.spent")} ${money(figure.spent)}`,
                ].filter(Boolean).join(" · ")}
              </ThemedText>
            </Row>
          )
        })}
      </Group>

      {view.figures.unallocatedPlanned !== 0 ? <ThemedText variant="subhead">{t("plan.unallocated", { amount: money(view.figures.unallocatedPlanned) })}</ThemedText> : null}
      {view.figures.fixedTotal > view.income.planned && view.income.planned > 0 ? (
        <Notice tone="error">{t("plan.fixedExceeds", { amount: money(view.figures.fixedTotal - view.income.planned) })}</Notice>
      ) : null}

      {view.buckets.length > 1 ? (
        <Button testID="open-move-money" variant="secondary" title={t("plan.move")} onPress={() => router.push({ pathname: "/move-money", params: { monthKey } })} />
      ) : null}
      {view.moves.length > 0 ? (
        <Group>
          {view.moves.map((move, index) => (
            <Row
              key={move.id}
              last={index === view.moves.length - 1}
              trailing={<Button testID={`undo-move-${index}`} variant="ghost" title={t("bills.undo")} onPress={() => void undoMove(move)} />}
            >
              <ThemedText>{`${nameOf(move.fromBucketId)} → ${nameOf(move.toBucketId)}`}</ThemedText>
              <ThemedText variant="caption">{[formatDay(move.movedOn, i18n.language, DAY), money(move.amount), move.reason].filter(Boolean).join(" · ")}</ThemedText>
            </Row>
          ))}
        </Group>
      ) : null}
    </Screen>
  )
}

const styles = StyleSheet.create({
  name: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  swatch: { width: spacing.md - spacing.xs, height: spacing.md - spacing.xs, borderRadius: radius.sm / 2 },
  free: { alignItems: "flex-end" },
})
