import { router, Stack } from "expo-router"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { Pressable, StyleSheet, View } from "react-native"

import { saveBuckets, type BucketInput } from "@mizan/core/db/plan"
import { formatMoney, fromMinorUnits, toMinorUnits } from "@/utils/money"
import { BASIS_POINTS } from "@mizan/core/domain/money/split"
import { basisPointsToPercent, percentToBasisPoints, rebalance } from "@mizan/core/domain/plan/figures"
import { Button } from "@/components/button"
import { Notice } from "@/components/notice"
import { Group } from "@/components/row"
import { Screen } from "@/components/screen"
import { TextField } from "@/components/text-field"
import { ThemedText } from "@/components/themed-text"
import { ToggleRow } from "@/components/toggle-row"
import { useSession } from "@/hooks/use-core"
import { useMonthView } from "@/hooks/use-views"
import { radius, spacing } from "@/theme"

/** The web's bucket colours; tapping a swatch steps to the next one, as a phone has no colour input. */
const PALETTE = ["#88aaee", "#ffdc58", "#ff6b6b", "#a3e635", "#c4a1ff", "#fd9745", "#7fdbca"]

export function PlanBuckets({ monthKey }: { monthKey: string }) {
  const { t, i18n } = useTranslation()
  const session = useSession()
  const startDay = session?.monthStartDay ?? 1
  const currency = session?.baseCurrency ?? "IQD"
  const view = useMonthView(monthKey, startDay)
  const [draft, setDraft] = useState<BucketInput[] | null>(null)

  useEffect(() => setDraft(null), [monthKey, view.plan?.id])

  const editing: BucketInput[] = draft ?? view.buckets.map((b) => ({ id: b.id, name: b.name, colour: b.colour, shareBasisPoints: b.shareBasisPoints, fixedAmount: b.fixedAmount, carryOver: b.carryOver }))
  const totalShares = editing.filter((b) => b.fixedAmount === null).reduce((sum, b) => sum + b.shareBasisPoints, 0)
  const fixedTotal = editing.reduce((sum, b) => sum + (b.fixedAmount ?? 0), 0)
  const gapShares = totalShares - BASIS_POINTS
  const gapAmount = Math.round(((view.income.planned - fixedTotal) * gapShares) / BASIS_POINTS)
  const money = (amount: number) => formatMoney(amount, currency, i18n.language)

  const update = (index: number, patch: Partial<BucketInput>) => setDraft(editing.map((b, i) => (i === index ? { ...b, ...patch } : b)))
  const nextColour = (colour: string) => PALETTE[(PALETTE.indexOf(colour) + 1) % PALETTE.length]

  async function save() {
    await saveBuckets(monthKey, editing.filter((b) => b.name.trim() !== ""))
    router.back()
  }

  return (
    <Screen>
      <Stack.Screen
        options={{
          title: t("plan.buckets"),
          headerRight: () => <Button testID="save-plan" variant="ghost" title={t("plan.save")} disabled={draft === null} onPress={() => void save()} />,
        }}
      />
      <ThemedText variant="subhead">{view.plan ? t("plan.versionNote", { from: view.plan.effectiveFrom }) : t("plan.noPlan")}</ThemedText>
      {editing.map((bucket, index) => (
        <Group key={bucket.id ?? `new-${index}`}>
          <View style={styles.bucket}>
            <View style={styles.nameRow}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t("plan.colour")}
                onPress={() => update(index, { colour: nextColour(bucket.colour) })}
                style={[styles.swatch, { backgroundColor: bucket.colour }]}
              />
              <View style={styles.flex}>
                <TextField testID={`bucket-name-${index}`} label={t("plan.name")} maxLength={80} value={bucket.name} onChangeText={(name) => update(index, { name })} />
              </View>
            </View>
            {bucket.fixedAmount === null ? (
              <TextField
                testID={`bucket-share-${index}`}
                label={`${t("plan.share")} (%)`}
                keyboardType="decimal-pad"
                value={String(basisPointsToPercent(bucket.shareBasisPoints))}
                onChangeText={(value) => update(index, { shareBasisPoints: percentToBasisPoints(Number(value) || 0) })}
              />
            ) : (
              <TextField
                label={t("plan.fixedAmount")}
                keyboardType="decimal-pad"
                value={fromMinorUnits(bucket.fixedAmount, currency)}
                onChangeText={(value) => update(index, { fixedAmount: toMinorUnits(value, currency) })}
              />
            )}
            <ToggleRow label={t("plan.fixedAmount")} value={bucket.fixedAmount !== null} onChange={(on) => update(index, { fixedAmount: on ? 0 : null, shareBasisPoints: on ? 0 : bucket.shareBasisPoints })} />
            <ToggleRow label={t("plan.carryOver")} value={bucket.carryOver} onChange={(carryOver) => update(index, { carryOver })} />
            <Button variant="ghost" title={t("plan.remove")} onPress={() => setDraft(editing.filter((_, i) => i !== index))} />
          </View>
        </Group>
      ))}
      <Button testID="add-bucket" variant="secondary" title={t("plan.addBucket")} onPress={() => setDraft([...editing, { name: "", colour: PALETTE[editing.length % PALETTE.length], shareBasisPoints: 0, fixedAmount: null, carryOver: false }])} />
      {gapShares !== 0 ? (
        <Button
          testID="rebalance"
          variant="secondary"
          title={t("plan.rebalance")}
          onPress={() => {
            const scaled = rebalance(editing.map((b) => (b.fixedAmount === null ? b.shareBasisPoints : 0)))
            setDraft(editing.map((b, i) => ({ ...b, shareBasisPoints: b.fixedAmount === null ? scaled[i] : 0 })))
          }}
        />
      ) : null}
      <Notice testID="plan-balance" tone={gapShares === 0 ? "info" : "error"}>
        {gapShares === 0
          ? t("plan.balanced")
          : gapShares > 0
            ? t("plan.over", { percent: basisPointsToPercent(gapShares), amount: money(gapAmount) })
            : t("plan.under", { percent: basisPointsToPercent(-gapShares), amount: money(-gapAmount) })}
      </Notice>
    </Screen>
  )
}

const styles = StyleSheet.create({
  bucket: { padding: spacing.md, gap: spacing.sm },
  nameRow: { flexDirection: "row", alignItems: "flex-end", gap: spacing.md },
  swatch: { width: 44, height: 44, borderRadius: radius.md, borderCurve: "continuous" },
  flex: { flex: 1 },
})
