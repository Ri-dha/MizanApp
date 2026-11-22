import { useTranslation } from "react-i18next"
import { View } from "react-native"

import { hasProvider } from "@mizan/core/db/cashAccounts"
import type { CashAccountKind } from "@mizan/core/schema"
import { Button } from "@/components/button"
import { Chips } from "@/components/chips"
import { CurrencyField } from "@/components/currency-field"
import { Group, Row } from "@/components/row"
import { Card, Section } from "@/components/soft-kit"
import { TextField } from "@/components/text-field"
import { ThemedText } from "@/components/themed-text"
import { ToggleRow } from "@/components/toggle-row"
import { makeStyles, spacing } from "@/theme"
import { KINDS, type AccountEditorModel } from "../use-account-editor-screen"

/** Soft: what the account is, then what it holds today, then every time its balance was set by hand. */
export function AccountEditorSoft({ model: m }: { model: AccountEditorModel }) {
  const { t } = useTranslation()
  const styles = useStyles()
  return (
    <>
      <Card>
        <TextField testID="account-name" label={t("accounts.name")} maxLength={80} value={m.name} onChangeText={m.setName} autoFocus={!m.id} />
        <View style={styles.field}>
          <ThemedText variant="subhead">{t("accounts.kind")}</ThemedText>
          <Chips testID="account-kind" options={KINDS.map((k) => ({ value: k, label: t(`accounts.kinds.${k}`) }))} value={m.kind} onChange={(next) => next && m.setKind(next as CashAccountKind)} />
        </View>
        {hasProvider(m.kind) ? <TextField testID="account-institution" label={t("accounts.institution")} maxLength={80} value={m.institution} onChangeText={m.setInstitution} /> : null}
      </Card>

      <Card>
        <View style={styles.pair}>
          <View style={styles.wide}><TextField testID="account-balance" label={t("accounts.balance")} keyboardType="decimal-pad" value={m.balance} onChangeText={m.setBalance} /></View>
          <View style={styles.narrow}><CurrencyField testID="account-currency" value={m.currency} onChange={m.setCurrency} /></View>
        </View>
        {m.id ? <TextField testID="account-adjustment-note" label={t("accounts.adjustmentNote")} maxLength={120} value={m.adjustmentNote} onChangeText={m.setAdjustmentNote} /> : null}
        <ToggleRow label={t("accounts.private")} value={m.isPrivate} onChange={m.setIsPrivate} />
      </Card>

      {m.account && m.adjustments.length > 0 ? (
        <Section title={t("accounts.adjustments")}>
          <Group>
            {m.adjustments.map((a, index) => (
              <Row key={a.id} last={index === m.adjustments.length - 1}>
                <ThemedText variant="subhead">
                  {t("accounts.adjustmentLine", { date: a.adjustedOn, from: m.money(a.previousBalance), to: m.money(a.newBalance) })}
                  {a.note ? ` · ${a.note}` : ""}
                </ThemedText>
              </Row>
            ))}
          </Group>
        </Section>
      ) : null}
      {m.id ? <Button testID="delete-account" variant="destructive" title={t("accounts.delete")} onPress={m.confirmDelete} /> : null}
    </>
  )
}

const useStyles = makeStyles(() => ({
  pair: { flexDirection: "row", gap: spacing.md, alignItems: "flex-end" },
  wide: { flex: 3 },
  narrow: { flex: 2, gap: spacing.xs },
  field: { gap: spacing.xs },
}))
