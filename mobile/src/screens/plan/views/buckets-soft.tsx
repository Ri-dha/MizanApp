import { useTranslation } from "react-i18next"
import { Pressable, View } from "react-native"

import { Button } from "@/components/button"
import { Notice } from "@/components/notice"
import { SoftCard } from "@/components/soft"
import { TextField } from "@/components/text-field"
import { ThemedText } from "@/components/themed-text"
import { ToggleRow } from "@/components/toggle-row"
import { makeStyles, radius, spacing } from "@/theme"
import type { BucketsScreenModel } from "../use-buckets-screen"

/** Soft: one card per bucket with its colour beside its name, its share or fixed amount, and a quiet remove link. */
export function BucketsSoft({ model }: { model: BucketsScreenModel }) {
  const { t } = useTranslation()
  const styles = useStyles()
  return (
    <>
      <ThemedText style={styles.body}>{model.versionNote}</ThemedText>
      {model.editing.map((bucket, index) => (
        <SoftCard key={bucket.id ?? `new-${index}`} style={styles.card}>
          <View style={styles.nameRow}>
            <Pressable accessibilityRole="button" accessibilityLabel={t("plan.colour")} onPress={() => model.stepColour(index)} style={[styles.swatch, { backgroundColor: bucket.colour }]} />
            <View style={styles.flex}>
              <TextField testID={`bucket-name-${index}`} label={t("plan.name")} maxLength={80} value={bucket.name} onChangeText={(name) => model.setName(index, name)} />
            </View>
          </View>
          {bucket.fixedAmount === null ? (
            <TextField testID={`bucket-share-${index}`} label={`${t("plan.share")} (%)`} keyboardType="decimal-pad" value={model.shareOf(bucket)} onChangeText={(value) => model.setShare(index, value)} />
          ) : (
            <TextField label={t("plan.fixedAmount")} keyboardType="decimal-pad" value={model.fixedOf(bucket)} onChangeText={(value) => model.setFixed(index, value)} />
          )}
          <ToggleRow label={t("plan.fixedAmount")} value={bucket.fixedAmount !== null} onChange={(on) => model.toggleFixed(index, on)} />
          <ToggleRow label={t("plan.carryOver")} value={bucket.carryOver} onChange={(carryOver) => model.setCarryOver(index, carryOver)} />
          <Pressable accessibilityRole="button" onPress={() => model.remove(index)} style={({ pressed }) => [styles.remove, pressed ? styles.pressed : null]}>
            <ThemedText style={styles.removeText}>{t("plan.remove")}</ThemedText>
          </Pressable>
        </SoftCard>
      ))}
      <Button testID="add-bucket" variant="secondary" title={t("plan.addBucket")} onPress={model.add} />
      {model.balanced ? null : <Button testID="rebalance" variant="secondary" title={t("plan.rebalance")} onPress={model.rebalance} />}
      <Notice testID="plan-balance" tone={model.balanced ? "info" : "error"}>{model.balanceText}</Notice>
    </>
  )
}

const useStyles = makeStyles((colors) => ({
  body: { fontSize: 14, lineHeight: 20, color: colors.secondaryLabel, paddingHorizontal: spacing.xs },
  card: { gap: spacing.sm },
  nameRow: { flexDirection: "row", alignItems: "flex-end", gap: spacing.md },
  swatch: { width: 44, height: 44, borderRadius: radius.md, borderCurve: "continuous" },
  flex: { flex: 1 },
  remove: { alignSelf: "flex-start", paddingVertical: spacing.xs },
  removeText: { fontSize: 15, fontWeight: "500", color: colors.destructive },
  pressed: { opacity: 0.6 },
}))
