import { useTranslation } from "react-i18next"
import { View } from "react-native"

import type { ExpenseFrequency } from "@mizan/core/schema"
import { Button } from "@/components/button"
import { Chips } from "@/components/chips"
import { CurrencyField } from "@/components/currency-field"
import { DateField } from "@/components/date-field"
import { Card, SectionTitle } from "@/components/soft-kit"
import { TextField } from "@/components/text-field"
import { ThemedText } from "@/components/themed-text"
import { ToggleRow } from "@/components/toggle-row"
import { makeStyles, spacing } from "@/theme"
import { FREQUENCIES, type BillEditorModel } from "../use-bill-editor-screen"

/** Soft: what the bill is and costs, when it falls due, then how it is filed, each in its own card. */
export function BillEditorSoft({ model: m }: { model: BillEditorModel }) {
  const { t } = useTranslation()
  const styles = useStyles()
  return (
    <>
      <Card>
        <TextField testID="bill-name" label={t("income.name")} maxLength={80} value={m.name} onChangeText={m.setName} autoFocus={!m.id} />
        <View style={styles.field}>
          <ThemedText variant="subhead">{t("transactions.bucket")}</ThemedText>
          <Chips options={m.buckets.map((b) => ({ value: b.id, label: b.name, swatch: b.colour }))} value={m.bucketId} onChange={m.setBucketId} />
        </View>
        <View style={styles.pair}>
          <View style={styles.wide}><TextField testID="bill-amount" label={t("income.amount")} keyboardType="decimal-pad" value={m.amount} onChangeText={m.setAmount} /></View>
          <View style={styles.narrow}><CurrencyField testID="bill-currency" value={m.currency} onChange={m.pickCurrency} /></View>
        </View>
        {m.needsRate ? <TextField testID="bill-rate" label={t("income.fxRate", { from: m.currency, to: m.base })} keyboardType="decimal-pad" value={m.rate} onChangeText={m.setRate} /> : null}
        <ToggleRow label={t("bills.isEstimate")} value={m.isEstimate} onChange={m.setIsEstimate} />
      </Card>

      <Card>
        <SectionTitle>{t("income.frequency")}</SectionTitle>
        <Chips testID="bill-frequency" options={FREQUENCIES.map((f) => ({ value: f, label: t(`bills.frequencies.${f}`) }))} value={m.frequency} onChange={(next) => next && m.setFrequency(next as ExpenseFrequency)} />
        {m.frequency === "MONTHLY" ? (
          <TextField testID="bill-due-day" label={t("bills.dueDay")} keyboardType="number-pad" maxLength={2} value={m.dueDay} onChangeText={m.setDueDay} />
        ) : (
          <>
            <DateField label={t("bills.anchorDate")} value={m.anchorDate} onChange={(iso) => iso && m.setAnchorDate(iso)} />
            <ThemedText variant="caption">{t("bills.anchorHint")}</ThemedText>
          </>
        )}
        {m.frequency === "CUSTOM" ? <TextField testID="bill-interval" label={t("bills.everyDays")} keyboardType="number-pad" value={m.intervalDays} onChangeText={m.setIntervalDays} /> : null}
        <DateField label={t("income.activeFrom")} value={m.activeFrom} onChange={(iso) => iso && m.setActiveFrom(iso)} />
        <DateField label={t("income.activeTo")} value={m.activeTo} onChange={m.setActiveTo} optional />
        <TextField testID="bill-reminder" label={t("bills.reminderDays")} keyboardType="number-pad" placeholder="3" value={m.reminderDays} onChangeText={m.setReminderDays} />
        <ThemedText variant="caption">{t("bills.reminderDaysHint")}</ThemedText>
      </Card>

      <Card>
        <ToggleRow label={t("subscriptions.switch")} value={m.subscription} onChange={m.setSubscription} />
        <TextField testID="bill-category" label={t("transactions.category")} maxLength={40} value={m.category} onChangeText={m.setCategory} />
        <ThemedText variant="caption">{t("subscriptions.categoryHint")}</ThemedText>
        <ToggleRow label={t("accounts.private")} value={m.isPrivate} onChange={m.setIsPrivate} />
      </Card>
      {m.id ? <Button testID="end-bill" variant="secondary" title={t("bills.end")} onPress={m.end} /> : null}
    </>
  )
}

const useStyles = makeStyles(() => ({
  pair: { flexDirection: "row", gap: spacing.md, alignItems: "flex-end" },
  wide: { flex: 3 },
  narrow: { flex: 2, gap: spacing.xs },
  field: { gap: spacing.xs },
}))
