import { useTranslation } from "react-i18next"
import { View } from "react-native"

import { nextShareRow, sharesFrom, type ShareRow } from "@mizan/core/db/accountChoice"
import { unassigned } from "@mizan/core/db/cashMovements"
import type { CashAccount } from "@mizan/core/schema"
import { radius, spacing, useBrandColors, makeStyles } from "@/theme"
import { formatMoney } from "@/utils/money"
import { AccountField } from "./account-field"
import { Button } from "./button"
import { Chips } from "./chips"
import { TextField } from "./text-field"
import { ThemedText } from "./themed-text"

/**
 * T-cash-movements: split an income across cash accounts, each by a fixed amount or a percentage.
 * What is left over goes into no account.
 */
export function AccountShares({ rows, onChange, accounts, amount, currency, label, hint }: {
  rows: ShareRow[]
  onChange: (rows: ShareRow[]) => void
  accounts: CashAccount[]
  amount: number
  currency: string
  label: string
  hint: string
}) {
  const styles = useStyles()
  const { t, i18n } = useTranslation()
  const brand = useBrandColors()
  const left = unassigned(amount, sharesFrom(rows, currency))
  const update = (index: number, patch: Partial<ShareRow>) => onChange(rows.map((r, i) => (i === index ? { ...r, ...patch } : r)))
  const money = (value: number) => formatMoney(value, currency, i18n.language)

  if (accounts.length === 0) {
    return (
      <View style={styles.field}>
        <ThemedText variant="subhead">{label}</ThemedText>
        <ThemedText variant="caption">{t("cashMovements.noAccounts")}</ThemedText>
      </View>
    )
  }

  return (
    <View style={styles.field}>
      <ThemedText variant="subhead">{label}</ThemedText>
      <ThemedText variant="caption">{hint}</ThemedText>
      {rows.map((row, index) => (
        <View key={index} testID={`share-${index}`} style={styles.row}>
          <AccountField label={t("cashMovements.account")} value={row.cashAccountId} onChange={(id) => update(index, { cashAccountId: id })}
            accounts={accounts} withNone={false} hint={null} testID={`share-${index}-account`} />
          <View style={styles.amountRow}>
            <Chips
              testID={`share-${index}-kind`}
              options={[{ value: "AMOUNT", label: currency }, { value: "PERCENT", label: "%" }]}
              value={row.kind}
              onChange={(kind) => kind && kind !== row.kind && update(index, { kind: kind as ShareRow["kind"], text: "" })}
            />
            <View style={styles.amount}>
              <TextField testID={`share-${index}-value`} label={row.kind === "AMOUNT" ? t("cashMovements.fixedAmount") : t("cashMovements.percentage")}
                keyboardType="decimal-pad" value={row.text} onChangeText={(text) => update(index, { text })} />
            </View>
          </View>
          <Button testID={`share-${index}-remove`} variant="ghost" title={t("cashMovements.remove")} onPress={() => onChange(rows.filter((_, i) => i !== index))} style={styles.remove} />
        </View>
      ))}
      <Button testID="add-share" variant="secondary" title={t("cashMovements.addAccount")}
        onPress={() => { const next = nextShareRow(rows, accounts); if (next) onChange([...rows, next]) }} />
      {rows.length > 0 ? (
        <ThemedText testID="share-total" variant="caption" style={left < 0 ? { color: brand.destructive } : null}>
          {left < 0 ? t("cashMovements.tooMuch", { amount: money(-left) }) : left > 0 ? t("cashMovements.leftOver", { amount: money(left) }) : t("cashMovements.allAssigned")}
        </ThemedText>
      ) : null}
    </View>
  )
}

const useStyles = makeStyles((colors) => ({
  field: { gap: spacing.sm },
  row: { gap: spacing.sm, padding: spacing.md, borderRadius: radius.md, borderCurve: "continuous", backgroundColor: colors.surface },
  amountRow: { flexDirection: "row", alignItems: "flex-end", gap: spacing.sm },
  amount: { flex: 1 },
  remove: { alignSelf: "flex-start" },
}))
