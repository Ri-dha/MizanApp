import { useTranslation } from "react-i18next"
import { View } from "react-native"

import { AccountShares } from "@/components/account-shares"
import { Button } from "@/components/button"
import { CurrencyField } from "@/components/currency-field"
import { DateField } from "@/components/date-field"
import { Card } from "@/components/soft-kit"
import { TextField } from "@/components/text-field"
import { ThemedText } from "@/components/themed-text"
import { makeStyles, spacing } from "@/theme"
import type { IncomeReceiptModel } from "../use-income-receipt-screen"

/** Soft: the amount and its date in one card, then which accounts the money went into. */
export function IncomeReceiptSoft({ model: m }: { model: IncomeReceiptModel }) {
  const { t } = useTranslation()
  const styles = useStyles()
  return (
    <>
      <Card>
        <View style={styles.pair}>
          <View style={styles.wide}><TextField testID="receipt-amount" label={t("income.amount")} keyboardType="decimal-pad" value={m.amount} onChangeText={m.setAmount} autoFocus={!m.receiptId} /></View>
          <View style={styles.narrow}><CurrencyField testID="receipt-currency" value={m.currency} onChange={m.pickCurrency} /></View>
        </View>
        {m.needsRate ? (
          <>
            <TextField testID="receipt-rate" label={t("income.fxRate", { from: m.currency, to: m.base })} keyboardType="decimal-pad" value={m.rate} onChangeText={m.setRate} />
            <ThemedText variant="caption">{`= ${m.inBase}`}</ThemedText>
          </>
        ) : null}
        <DateField label={t("income.receivedOnLabel")} value={m.receivedOn} onChange={(iso) => iso && m.setReceivedOn(iso)} />
        <TextField testID="receipt-note" label={t("income.note")} maxLength={120} value={m.note} onChangeText={m.setNote} />
      </Card>
      <Card>
        <AccountShares rows={m.shares} onChange={m.setShares} accounts={m.accounts} amount={m.minor} currency={m.currency}
          label={t("cashMovements.intoAccounts")} hint={t("cashMovements.intoAccountsHint")} />
      </Card>
      {m.existing ? <Button testID="delete-receipt" variant="destructive" title={t("accounts.delete")} onPress={m.remove} /> : null}
    </>
  )
}

const useStyles = makeStyles(() => ({
  pair: { flexDirection: "row", gap: spacing.md, alignItems: "flex-end" },
  wide: { flex: 3 },
  narrow: { flex: 2, gap: spacing.xs },
}))
