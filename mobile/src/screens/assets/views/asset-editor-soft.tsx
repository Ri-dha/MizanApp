import { useTranslation } from "react-i18next"
import { View } from "react-native"

import { ATTRIBUTE_KEYS } from "@mizan/core/db/assets"
import type { DepreciationMethod } from "@mizan/core/domain/asset/depreciation"
import type { AssetType } from "@mizan/core/schema"
import { Button } from "@/components/button"
import { Chips } from "@/components/chips"
import { CurrencyField } from "@/components/currency-field"
import { DateField } from "@/components/date-field"
import { Card, SectionTitle } from "@/components/soft-kit"
import { TextField } from "@/components/text-field"
import { ThemedText } from "@/components/themed-text"
import { ToggleRow } from "@/components/toggle-row"
import { makeStyles, spacing } from "@/theme"
import { ASSET_TYPES } from ".."
import { METHODS, NUMERIC_ATTRIBUTES, type AssetEditorModel } from "../use-asset-editor-screen"

/** Soft: what the asset is and its details, what it cost, how it loses value, then how it is filed. */
export function AssetEditorSoft({ model: m }: { model: AssetEditorModel }) {
  const { t } = useTranslation()
  const styles = useStyles()
  return (
    <>
      <Card>
        <View style={styles.field}>
          <ThemedText variant="subhead">{t("assets.type")}</ThemedText>
          <Chips testID="asset-type" options={ASSET_TYPES.map((k) => ({ value: k, label: t(`assets.types.${k}`) }))} value={m.type} onChange={(next) => next && m.changeType(next as AssetType)} />
        </View>
        <TextField testID="asset-name" label={t("accounts.name")} maxLength={80} value={m.name} onChangeText={m.setName} autoFocus={!m.id} />
        {ATTRIBUTE_KEYS[m.type].map((key) => (
          <TextField
            key={key}
            testID={`asset-attr-${key}`}
            label={t(`assets.attributes.${key}`)}
            keyboardType={NUMERIC_ATTRIBUTES.has(key) ? "number-pad" : "default"}
            maxLength={120}
            value={m.attributes[key] ?? ""}
            onChangeText={(v) => m.setAttributes({ ...m.attributes, [key]: v })}
          />
        ))}
      </Card>

      <Card>
        <View style={styles.pair}>
          <View style={styles.wide}><TextField testID="asset-price" label={t("assets.purchasePrice")} keyboardType="decimal-pad" value={m.price} onChangeText={m.setPrice} /></View>
          <View style={styles.narrow}><CurrencyField testID="asset-currency" value={m.currency} onChange={m.setCurrency} /></View>
        </View>
        <DateField label={t("assets.purchaseDate")} value={m.purchaseDate} onChange={m.setPurchaseDate} optional />
      </Card>

      <Card>
        <SectionTitle>{t("assets.depreciation")}</SectionTitle>
        <Chips testID="asset-method" options={METHODS.map((k) => ({ value: k, label: t(`assets.methods.${k}`) }))} value={m.method} onChange={(next) => next && m.setMethod(next as DepreciationMethod)} />
        <ThemedText variant="caption">{t(`assets.methodHints.${m.method}`)}</ThemedText>
        {m.method !== "NONE" ? (
          <View style={styles.pair}>
            <View style={styles.half}><TextField testID="asset-rate" label={t("assets.annualRate")} keyboardType="decimal-pad" value={m.rate} onChangeText={m.setRate} /></View>
            <View style={styles.half}><TextField testID="asset-salvage" label={t("assets.salvage")} keyboardType="decimal-pad" value={m.salvage} onChangeText={m.setSalvage} /></View>
          </View>
        ) : null}
      </Card>

      <Card>
        <ToggleRow label={t("assets.illiquid")} value={m.illiquid} onChange={m.setIlliquid} />
        <TextField label={t("transactions.note")} maxLength={200} value={m.note} onChangeText={m.setNote} />
        <ToggleRow label={t("accounts.private")} value={m.isPrivate} onChange={m.setIsPrivate} />
      </Card>
      {m.id ? <Button testID="delete-asset" variant="destructive" title={t("accounts.delete")} onPress={m.confirmDelete} /> : null}
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
