import { SegmentedControl } from "@expo/ui/community/segmented-control"
import { useTranslation } from "react-i18next"
import { View } from "react-native"

import { AccountField } from "@/components/account-field"
import { Button } from "@/components/button"
import { Chips } from "@/components/chips"
import { CurrencyField } from "@/components/currency-field"
import { DatePicker } from "@/components/date-picker"
import { Notice } from "@/components/notice"
import { ReceiptField } from "@/components/receipt-field"
import { SoftCard } from "@/components/soft"
import { TextField } from "@/components/text-field"
import { ThemedText } from "@/components/themed-text"
import { ToggleRow } from "@/components/toggle-row"
import { makeStyles, spacing } from "@/theme"
import type { TransactionEditorModel } from "../use-transaction-editor"

/** Soft: the kind on top, then one card for how much and when, one for where it belongs, and one for the details. */
export function TransactionEditorSoft({ model }: { model: TransactionEditorModel }) {
  const { t } = useTranslation()
  const styles = useStyles()
  const { type } = model
  return (
    <>
      {model.partOfSplit ? <Notice>{t("transactions.partOfSplit")}</Notice> : null}
      <SegmentedControl
        testID="transaction-type"
        values={model.types.map((value) => t(`transactions.types.${value}`))}
        selectedIndex={model.types.indexOf(type)}
        onChange={(event) => model.setType(model.types[event.nativeEvent.selectedSegmentIndex])}
      />
      <SoftCard style={styles.card}>
        <View style={styles.amountRow}>
          <View style={styles.amount}>
            <TextField testID="new-amount" label={t("transactions.amount")} keyboardType="decimal-pad" value={model.amount} onChangeText={model.setAmount} autoFocus={!model.editing} />
          </View>
          <View style={styles.currency}>
            <CurrencyField testID="transaction-currency" value={model.currency} onChange={model.pickCurrency} />
          </View>
        </View>
        {model.needsRate ? <TextField testID="fx-rate" label={t("income.fxRate")} keyboardType="decimal-pad" value={model.rate} onChangeText={model.setRate} /> : null}
        <View style={styles.dateRow}>
          <ThemedText style={styles.label}>{t("transactions.date")}</ThemedText>
          <DatePicker testID="transaction-date" value={model.occurredOn} onChange={model.setOccurredOn} />
        </View>
      </SoftCard>

      <SoftCard style={styles.card}>
        {type !== "INCOME" && !model.split && !model.bucketless ? (
          <View style={styles.field}>
            <ThemedText style={styles.label}>{type === "TRANSFER" ? t("transactions.fromBucket") : t("transactions.bucket")}</ThemedText>
            {model.buckets.length === 0 ? <ThemedText variant="subhead">{t("plan.noBuckets")}</ThemedText> : <Chips testID="bucket" options={model.bucketChips} value={model.bucketId} onChange={model.setBucketId} />}
          </View>
        ) : null}
        {type === "EXPENSE" || type === "INCOME" ? (
          <AccountField testID="transaction-account" label={type === "EXPENSE" ? t("cashMovements.paidFrom") : t("cashMovements.intoAccount")}
            value={model.accountId} onChange={model.setAccountId} accounts={model.accounts} />
        ) : null}
        {type === "TRANSFER" ? (
          <View style={styles.field}>
            <ThemedText style={styles.label}>{t("transactions.to")}</ThemedText>
            <Chips testID="counterparty" options={model.counterparties} value={model.counterparty} onChange={model.setCounterparty} />
          </View>
        ) : null}
        {type === "EXPENSE" && !model.editing && !model.bucketless ? <ToggleRow testID="split" label={t("transactions.split")} value={model.split} onChange={model.toggleSplit} /> : null}
        {model.split ? (
          <View style={styles.parts}>
            {model.parts.map((part, index) => (
              <View key={index} style={styles.field}>
                <Chips options={model.bucketChips} value={part.bucketId} onChange={(value) => model.updatePart(index, { bucketId: value })} />
                <TextField label={t("transactions.amount")} keyboardType="decimal-pad" value={part.amount} onChangeText={(value) => model.updatePart(index, { amount: value })} />
              </View>
            ))}
            <ThemedText variant="subhead" style={model.splitRemainder !== 0 ? styles.negative : null}>{t("transactions.splitRemainder", { amount: model.splitRemainderText })}</ThemedText>
            <Button variant="secondary" title={t("transactions.addPart")} onPress={model.addPart} />
          </View>
        ) : null}
      </SoftCard>

      <SoftCard style={styles.card}>
        <TextField testID="new-payee" label={t("transactions.payee")} value={model.payee} onChangeText={model.setPayee} />
        <TextField testID="new-category" label={t("transactions.category")} value={model.category} onChangeText={model.setCategory} />
        {model.showSuggested ? <ThemedText variant="caption">{t("transactions.suggested")}</ThemedText> : null}
        <TextField testID="new-note" label={t("income.note")} value={model.note} onChangeText={model.setNote} multiline />
        <ReceiptField attachmentId={model.attachmentId} ownerType="TRANSACTION" ownerRecordId={model.draftId} onChange={model.setAttachmentId} />
        <ToggleRow testID="private" label={t("accounts.private")} value={model.isPrivate} onChange={model.setIsPrivate} />
      </SoftCard>
      {model.problem ? <Notice tone="error" testID="editor-problem">{model.problem}</Notice> : null}
      {model.editing ? <Button testID="delete-transaction" variant="destructive" title={t("accounts.delete")} onPress={model.remove} /> : null}
    </>
  )
}

const useStyles = makeStyles((colors) => ({
  card: { gap: spacing.md - spacing.xs },
  amountRow: { flexDirection: "row", gap: spacing.md, alignItems: "flex-end" },
  amount: { flex: 3 },
  currency: { flex: 2, gap: spacing.xs },
  dateRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 44 },
  field: { gap: spacing.xs },
  label: { fontSize: 13, lineHeight: 18, fontWeight: "500", color: colors.secondaryLabel },
  parts: { gap: spacing.md, borderTopWidth: 1, borderTopColor: colors.separator, paddingTop: spacing.md - spacing.xs },
  negative: { color: colors.destructive },
}))
