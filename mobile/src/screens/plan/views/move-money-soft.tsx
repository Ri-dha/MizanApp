import { useTranslation } from "react-i18next"
import { View } from "react-native"

import { Chips } from "@/components/chips"
import { DatePicker } from "@/components/date-picker"
import { Banner, Card } from "@/components/soft-kit"
import { TextField } from "@/components/text-field"
import { ThemedText } from "@/components/themed-text"
import { makeStyles, radius, spacing } from "@/theme"
import type { MoveMoneyModel } from "../use-move-money"

/** Soft: where the money leaves and where it lands in one card with an arrow between them, then how much, when and why. */
export function MoveMoneySoft({ model }: { model: MoveMoneyModel }) {
  const { t } = useTranslation()
  const styles = useStyles()
  return (
    <>
      <Card style={styles.card}>
        <View style={styles.field}>
          <ThemedText style={styles.label}>{t("transactions.fromBucket")}</ThemedText>
          <Chips testID="move-from" options={model.fromOptions} value={model.fromId} onChange={model.setFromId} />
        </View>
        <View style={styles.between}>
          <View style={styles.line} />
          <View style={styles.arrow}><ThemedText style={styles.arrowText}>↓</ThemedText></View>
          <View style={styles.line} />
        </View>
        <View style={styles.field}>
          <ThemedText style={styles.label}>{t("transactions.to")}</ThemedText>
          <Chips testID="move-to" options={model.toOptions} value={model.toId} onChange={model.setToId} />
        </View>
      </Card>
      <TextField testID="move-amount" label={t("transactions.amount")} keyboardType="decimal-pad" value={model.amount} onChangeText={model.setAmount} />
      <View style={styles.dateRow}>
        <ThemedText style={styles.label}>{t("transactions.date")}</ThemedText>
        <DatePicker testID="move-date" value={model.on} onChange={model.setOn} />
      </View>
      <TextField testID="move-reason" label={t("plan.reason")} placeholder={t("plan.reasonHint")} maxLength={120} value={model.reason} onChangeText={model.setReason} />
      <Banner>{t("plan.moveHint")}</Banner>
    </>
  )
}

const useStyles = makeStyles((colors) => ({
  card: { gap: spacing.sm },
  field: { gap: spacing.xs },
  label: { fontSize: 13, lineHeight: 18, fontWeight: "500", color: colors.secondaryLabel },
  between: { flexDirection: "row", alignItems: "center", gap: spacing.sm + 2 },
  line: { flex: 1, height: 1, backgroundColor: colors.separator },
  arrow: { width: 32, height: 32, borderRadius: radius.full, alignItems: "center", justifyContent: "center", backgroundColor: colors.accent },
  arrowText: { color: colors.onAccent, fontSize: 17, fontWeight: "600" },
  dateRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 44 },
}))
