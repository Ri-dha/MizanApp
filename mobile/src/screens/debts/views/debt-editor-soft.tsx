import { SegmentedControl } from "@expo/ui/community/segmented-control"
import { useTranslation } from "react-i18next"
import { View } from "react-native"

import { AccountField } from "@/components/account-field"
import { Button } from "@/components/button"
import { Chips } from "@/components/chips"
import { CurrencyField } from "@/components/currency-field"
import { DateField } from "@/components/date-field"
import { Card } from "@/components/soft-kit"
import { TextField } from "@/components/text-field"
import { ThemedText } from "@/components/themed-text"
import { ToggleRow } from "@/components/toggle-row"
import { makeStyles, spacing } from "@/theme"
import { DIRECTIONS, type DebtEditorModel } from "../use-debt-editor-screen"

/** Soft: which way the debt runs, who and how much, its terms, then where the money sits. */
export function DebtEditorSoft({ model: m }: { model: DebtEditorModel }) {
  const { t } = useTranslation()
  const styles = useStyles()
  const owing = m.direction === "OWING"
  return (
    <>
      <SegmentedControl
        values={DIRECTIONS.map((d) => t(`debts.directions.${d}`))}
        selectedIndex={DIRECTIONS.indexOf(m.direction)}
        onChange={(event) => m.setDirection(DIRECTIONS[event.nativeEvent.selectedSegmentIndex])}
      />
      <Card>
        <TextField testID="debt-name" label={t("income.name")} maxLength={80} value={m.name} onChangeText={m.setName} autoFocus={!m.id} />
        <TextField testID="debt-counterparty" label={t("debts.counterparty")} maxLength={80} value={m.counterparty} onChangeText={m.setCounterparty} />
        <View style={styles.pair}>
          <View style={styles.wide}><TextField testID="debt-principal" label={t("debts.principal")} keyboardType="decimal-pad" value={m.principal} onChangeText={m.setPrincipal} /></View>
          <View style={styles.narrow}><CurrencyField testID="debt-currency" value={m.currency} onChange={m.pickCurrency} /></View>
        </View>
        {m.needsRate ? <TextField testID="debt-rate" label={t("income.fxRate", { from: m.currency, to: m.base })} keyboardType="decimal-pad" value={m.rate} onChangeText={m.setRate} /> : null}
      </Card>

      <Card>
        <View style={styles.pair}>
          <View style={styles.half}><TextField testID="debt-annual" label={t("debts.annualRate")} keyboardType="decimal-pad" value={m.annualPercent} onChangeText={m.setAnnualPercent} /></View>
          <View style={styles.half}><TextField testID="debt-term" label={t("debts.termMonths")} keyboardType="number-pad" value={m.termMonths} onChangeText={m.setTermMonths} /></View>
        </View>
        <ThemedText variant="caption">{t("debts.rateHint")}</ThemedText>
        <TextField testID="debt-monthly" label={t("debts.monthlyPayment")} keyboardType="decimal-pad" value={m.monthlyPayment} onChangeText={m.setMonthlyPayment} />
        <DateField label={t("debts.startDate")} value={m.startDate} onChange={(iso) => iso && m.setStartDate(iso)} />
      </Card>

      <Card>
        {owing ? (
          <View style={styles.field}>
            <ThemedText variant="subhead">{t("debts.paidFromBucket")}</ThemedText>
            <Chips options={m.buckets.map((b) => ({ value: b.id, label: b.name, swatch: b.colour }))} value={m.bucketId} onChange={m.setBucketId} />
          </View>
        ) : null}
        <AccountField testID="debt-account" label={owing ? t("debts.receivedInto") : t("debts.takenFrom")} value={m.accountId} onChange={m.setAccountId} accounts={m.accounts} />
        <ToggleRow label={t("accounts.private")} value={m.isPrivate} onChange={m.setIsPrivate} />
      </Card>
      {m.id ? <Button testID="delete-debt" variant="destructive" title={t("accounts.delete")} onPress={m.remove} /> : null}
    </>
  )
}

const useStyles = makeStyles(() => ({
  pair: { flexDirection: "row", gap: spacing.md, alignItems: "flex-end" },
  wide: { flex: 3 },
  narrow: { flex: 2, gap: spacing.xs },
  half: { flex: 1 },
  field: { gap: spacing.xs },
}))
