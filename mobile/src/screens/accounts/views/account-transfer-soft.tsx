import { useTranslation } from "react-i18next"
import { View } from "react-native"

import { AccountField } from "@/components/account-field"
import { Button } from "@/components/button"
import { DateField } from "@/components/date-field"
import { Banner, Card } from "@/components/soft-kit"
import { TextField } from "@/components/text-field"
import { ThemedText } from "@/components/themed-text"
import { makeStyles, radius, spacing } from "@/theme"
import type { AccountTransferModel } from "../use-account-transfer-screen"

/** Soft: the account the money leaves and the one it lands in share a card with an arrow between them, then how much, when and why. */
export function AccountTransferSoft({ model: m }: { model: AccountTransferModel }) {
  const { t } = useTranslation()
  const styles = useStyles()
  if (m.accounts.length < 2) return <ThemedText variant="subhead">{t("cashMovements.needTwoAccounts")}</ThemedText>
  return (
    <>
      <Card>
        <AccountField testID="transfer-from" label={t("cashMovements.from")} value={m.fromId} onChange={m.setFromId} accounts={m.fromChoices} withNone={false} hint={null} />
        <View style={styles.between}>
          <View style={styles.line} />
          <View style={styles.arrow}><ThemedText style={styles.arrowText}>↓</ThemedText></View>
          <View style={styles.line} />
        </View>
        <AccountField testID="transfer-to" label={t("cashMovements.to")} value={m.toId} onChange={m.setToId} accounts={m.toChoices} withNone={false} hint={null} />
      </Card>
      <Card>
        <TextField testID="transfer-amount" label={t("cashMovements.amountSent", { currency: m.from?.currency ?? "" })} keyboardType="decimal-pad" value={m.amount} onChangeText={m.setAmount} autoFocus={!m.id} />
        {m.exchange ? (
          <>
            <TextField testID="transfer-received" label={t("cashMovements.amountReceived", { currency: m.to?.currency ?? "" })} keyboardType="decimal-pad" value={m.received} onChangeText={m.typeReceived} />
            <ThemedText variant="caption">{t("cashMovements.receivedHint")}</ThemedText>
          </>
        ) : null}
        <DateField label={t("transactions.date")} value={m.occurredOn} onChange={(iso) => iso && m.setOccurredOn(iso)} />
        <TextField testID="transfer-note" label={t("income.note")} maxLength={120} value={m.note} onChangeText={m.setNote} />
      </Card>
      <Banner>{t("cashMovements.transferHint")}</Banner>
      {m.id ? <Button testID="delete-transfer" variant="destructive" title={t("accounts.delete")} onPress={m.remove} /> : null}
    </>
  )
}

const useStyles = makeStyles((colors) => ({
  between: { flexDirection: "row", alignItems: "center", gap: spacing.sm + 2 },
  line: { flex: 1, height: 1, backgroundColor: colors.separator },
  arrow: { width: 32, height: 32, borderRadius: radius.full, alignItems: "center", justifyContent: "center", backgroundColor: colors.accent },
  arrowText: { color: colors.onAccent, fontSize: 17, fontWeight: "600" },
}))
