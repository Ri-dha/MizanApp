import { router, Stack } from "expo-router"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"

import { liveAssets } from "@mizan/core/db/assets"
import { createGoal, updateGoal } from "@mizan/core/db/goals"
import { liveBucketsOf, livePlans, planFor } from "@mizan/core/db/plan"
import { defaultsOf, livePrivacySetting } from "@mizan/core/db/privacy"
import { writeFields } from "@mizan/core/db/write"
import { fromMinorUnits, toMinorUnits } from "@mizan/core/domain/money/format"
import type { Goal } from "@mizan/core/schema"
import { table } from "@mizan/core/store/store"
import { Button } from "@/components/button"
import { Chips } from "@/components/chips"
import { DateField } from "@/components/date-field"
import { Screen } from "@/components/screen"
import { TextField } from "@/components/text-field"
import { ThemedText } from "@/components/themed-text"
import { ToggleRow } from "@/components/toggle-row"
import { useLiveQuery, useSession } from "@/hooks/use-core"
import { currentMonthKey } from "@/hooks/use-views"
import { spacing } from "@/theme"
import { CurrencyField } from "@/components/currency-field"


export function GoalEditor({ id }: { id?: string }) {
  const { t } = useTranslation()
  const session = useSession()
  const base = session?.baseCurrency ?? "IQD"
  const startDay = session?.monthStartDay ?? 1
  const goal = useLiveQuery(() => (id ? table("goals").get(id) : Promise.resolve(undefined)), [id], undefined)
  const privacy = useLiveQuery(async () => defaultsOf(await livePrivacySetting()), [], defaultsOf(undefined))
  const buckets = useLiveQuery(async () => liveBucketsOf(planFor(await livePlans(), currentMonthKey(startDay))?.id), [startDay], [])
  const assets = useLiveQuery(liveAssets, [], [])
  const [name, setName] = useState("")
  const [target, setTarget] = useState("")
  const [alreadySaved, setAlreadySaved] = useState("")
  const [currency, setCurrency] = useState(base)
  const [targetDate, setTargetDate] = useState<string | null>(null)
  const [contribution, setContribution] = useState("")
  const [bucketId, setBucketId] = useState<string | null>(null)
  const [assetId, setAssetId] = useState<string | null>(null)
  const [isPrivate, setIsPrivate] = useState(false)
  const [loaded, setLoaded] = useState(!id)

  useEffect(() => {
    if (!goal || loaded) return
    setName(goal.name)
    setTarget(fromMinorUnits(goal.targetAmount, goal.currency))
    setCurrency(goal.currency)
    setAlreadySaved(goal.openingAmount ? fromMinorUnits(goal.openingAmount, goal.currency) : "")
    setTargetDate(goal.targetDate)
    setContribution(goal.monthlyContribution ? fromMinorUnits(goal.monthlyContribution, goal.currency) : "")
    setBucketId(goal.bucketId)
    setAssetId(goal.backingAssetId)
    setIsPrivate(goal.visibility === "PRIVATE")
    setLoaded(true)
  }, [goal, loaded])

  useEffect(() => {
    if (!id) setIsPrivate(privacy.goals === "PRIVATE")
  }, [id, privacy.goals])

  async function save() {
    const input = {
      name: name.trim(), targetAmount: toMinorUnits(target, currency), currency, targetDate,
      openingAmount: alreadySaved ? toMinorUnits(alreadySaved, currency) : 0,
      monthlyContribution: contribution ? toMinorUnits(contribution, currency) : null,
      bucketId, backingAssetId: assetId, note: null,
      visibility: isPrivate ? ("PRIVATE" as const) : ("SHARED" as const),
    }
    if (id) await updateGoal(id, input)
    else await createGoal(input)
    router.back()
  }

  async function archive() {
    if (!id) return
    await writeFields<Goal>("goal", id, { status: "ARCHIVED" })
    router.back()
  }

  return (
    <Screen sheet>
      <Stack.Screen options={{ title: id ? t("goals.edit") : t("goals.add"), headerRight: () => <Button testID="save-goal" variant="ghost" title={t("accounts.save")} disabled={!name.trim() || !target} onPress={() => void save()} /> }} />
      <TextField testID="goal-name" label={t("income.name")} maxLength={80} value={name} onChangeText={setName} autoFocus={!id} />
      <View style={styles.amountRow}>
        <View style={styles.amount}><TextField testID="goal-target" label={t("goals.target")} keyboardType="decimal-pad" value={target} onChangeText={setTarget} /></View>
        <View style={styles.currency}>
          <CurrencyField testID="goal-currency" value={currency} onChange={setCurrency} />
        </View>
      </View>
      {assetId ? null : (
        <>
          <TextField testID="goal-already-saved" label={t("goals.alreadySaved", { currency })} keyboardType="decimal-pad" value={alreadySaved} onChangeText={setAlreadySaved} />
          <ThemedText variant="caption">{t("goals.alreadySavedHint")}</ThemedText>
        </>
      )}
      <DateField label={t("goals.targetDate")} value={targetDate} onChange={setTargetDate} optional />
      <TextField testID="goal-monthly" label={t("goals.monthly")} keyboardType="decimal-pad" value={contribution} onChangeText={setContribution} />
      <ThemedText variant="caption">{t("goals.eitherHint")}</ThemedText>
      <View style={styles.field}>
        <ThemedText variant="subhead">{t("debts.paidFromBucket")}</ThemedText>
        <Chips options={buckets.map((b) => ({ value: b.id, label: b.name, swatch: b.colour }))} value={bucketId} onChange={setBucketId} />
      </View>
      {assets.some((a) => a.status === "HELD") ? (
        <View style={styles.field}>
          <ThemedText variant="subhead">{t("goals.backingAsset")}</ThemedText>
          <Chips options={assets.filter((a) => a.status === "HELD").map((a) => ({ value: a.id, label: a.name }))} value={assetId} onChange={setAssetId} />
          <ThemedText variant="caption">{t("goals.backingAssetHint")}</ThemedText>
        </View>
      ) : null}
      <ToggleRow label={t("accounts.private")} value={isPrivate} onChange={setIsPrivate} />
      {id ? <Button variant="secondary" title={t("goals.archive")} onPress={() => void archive()} /> : null}
    </Screen>
  )
}

const styles = StyleSheet.create({
  amountRow: { flexDirection: "row", gap: spacing.md, alignItems: "flex-end" },
  amount: { flex: 3 },
  currency: { flex: 2, gap: spacing.xs },
  field: { gap: spacing.xs },
})
