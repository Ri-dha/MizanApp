import { useTranslation } from "react-i18next"
import { View } from "react-native"

import { Button } from "@/components/button"
import { Chips } from "@/components/chips"
import { CurrencyField } from "@/components/currency-field"
import { DateField } from "@/components/date-field"
import { Card } from "@/components/soft-kit"
import { TextField } from "@/components/text-field"
import { ThemedText } from "@/components/themed-text"
import { ToggleRow } from "@/components/toggle-row"
import { makeStyles, spacing } from "@/theme"
import type { GoalEditorModel } from "../use-goal-editor-screen"

/** Soft: the goal and its target, how it gets there, then what pays for it and what backs it. */
export function GoalEditorSoft({ model: m }: { model: GoalEditorModel }) {
  const { t } = useTranslation()
  const styles = useStyles()
  return (
    <>
      <Card>
        <TextField testID="goal-name" label={t("income.name")} maxLength={80} value={m.name} onChangeText={m.setName} autoFocus={!m.id} />
        <View style={styles.pair}>
          <View style={styles.wide}><TextField testID="goal-target" label={t("goals.target")} keyboardType="decimal-pad" value={m.target} onChangeText={m.setTarget} /></View>
          <View style={styles.narrow}><CurrencyField testID="goal-currency" value={m.currency} onChange={m.setCurrency} /></View>
        </View>
        {m.assetId ? null : (
          <>
            <TextField testID="goal-already-saved" label={t("goals.alreadySaved", { currency: m.currency })} keyboardType="decimal-pad" value={m.alreadySaved} onChangeText={m.setAlreadySaved} />
            <ThemedText variant="caption">{t("goals.alreadySavedHint")}</ThemedText>
          </>
        )}
      </Card>

      <Card>
        <DateField label={t("goals.targetDate")} value={m.targetDate} onChange={m.setTargetDate} optional />
        <TextField testID="goal-monthly" label={t("goals.monthly")} keyboardType="decimal-pad" value={m.contribution} onChangeText={m.setContribution} />
        <ThemedText variant="caption">{t("goals.eitherHint")}</ThemedText>
      </Card>

      <Card>
        <View style={styles.field}>
          <ThemedText variant="subhead">{t("debts.paidFromBucket")}</ThemedText>
          <Chips options={m.buckets.map((b) => ({ value: b.id, label: b.name, swatch: b.colour }))} value={m.bucketId} onChange={m.setBucketId} />
        </View>
        {m.heldAssets.length > 0 ? (
          <View style={styles.field}>
            <ThemedText variant="subhead">{t("goals.backingAsset")}</ThemedText>
            <Chips options={m.heldAssets.map((a) => ({ value: a.id, label: a.name }))} value={m.assetId} onChange={m.setAssetId} />
            <ThemedText variant="caption">{t("goals.backingAssetHint")}</ThemedText>
          </View>
        ) : null}
        <ToggleRow label={t("accounts.private")} value={m.isPrivate} onChange={m.setIsPrivate} />
      </Card>
      {m.id ? <Button variant="secondary" title={t("goals.archive")} onPress={m.archive} /> : null}
    </>
  )
}

const useStyles = makeStyles(() => ({
  pair: { flexDirection: "row", gap: spacing.md, alignItems: "flex-end" },
  wide: { flex: 3 },
  narrow: { flex: 2, gap: spacing.xs },
  field: { gap: spacing.xs },
}))
