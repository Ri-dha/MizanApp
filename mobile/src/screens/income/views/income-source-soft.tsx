import { useTranslation } from "react-i18next"
import { View } from "react-native"

import type { Frequency } from "@mizan/core/schema"
import { AccountShares } from "@/components/account-shares"
import { Button } from "@/components/button"
import { Chips } from "@/components/chips"
import { CurrencyField } from "@/components/currency-field"
import { DateField } from "@/components/date-field"
import { Group, Row } from "@/components/row"
import { Card, Section, SectionTitle } from "@/components/soft-kit"
import { TextField } from "@/components/text-field"
import { ThemedText } from "@/components/themed-text"
import { ToggleRow } from "@/components/toggle-row"
import { makeStyles, spacing } from "@/theme"
import { FREQUENCIES, type IncomeSourceModel } from "../use-income-source-screen"

/** Soft: the source and its amount, when it pays, where it lands, then its history of raises with the next one. */
export function IncomeSourceSoft({ model: m }: { model: IncomeSourceModel }) {
  const { t } = useTranslation()
  const styles = useStyles()
  const { source, timeline } = m
  return (
    <>
      <Card>
        <TextField testID="source-name" label={t("income.name")} maxLength={80} value={m.name} onChangeText={m.setName} autoFocus={!m.id} />
        <View style={styles.pair}>
          <View style={styles.wide}>
            <TextField testID="source-amount" label={m.id ? t("income.currentAmount") : t("income.amount")} keyboardType="decimal-pad" value={m.amount} onChangeText={m.setAmount} editable={!m.id} />
          </View>
          <View style={styles.narrow}><CurrencyField testID="source-currency" value={m.currency} onChange={m.pickCurrency} /></View>
        </View>
        {m.id ? <ThemedText variant="caption">{t("income.amountLocked")}</ThemedText> : null}
        {m.needsRate ? (
          <>
            <TextField testID="source-rate" label={t("income.fxRate", { from: m.currency, to: m.base })} keyboardType="decimal-pad" value={m.rate} onChangeText={m.setRate} />
            <ThemedText variant="caption">{t("income.fxRateHint")}</ThemedText>
          </>
        ) : null}
      </Card>

      <Card>
        <SectionTitle>{t("income.frequency")}</SectionTitle>
        <Chips testID="source-frequency" options={FREQUENCIES.map((f) => ({ value: f, label: t(`income.frequencies.${f}`) }))} value={m.frequency} onChange={(next) => next && m.setFrequency(next as Frequency)} />
        {m.usesPayDay ? (
          <TextField testID="source-pay-day" label={t("income.payDay")} keyboardType="number-pad" maxLength={2} value={m.payDay} onChangeText={m.setPayDay} />
        ) : (
          <>
            <DateField label={m.oneOff ? t("income.paidOn") : t("income.anchorDate")} value={m.anchorDate} onChange={(iso) => iso && m.setAnchorDate(iso)} />
            {m.oneOff ? null : <ThemedText variant="caption">{t("income.anchorHint")}</ThemedText>}
          </>
        )}
        {m.oneOff ? null : (
          <>
            <DateField label={t("income.activeFrom")} value={m.activeFrom} onChange={(iso) => iso && m.setActiveFrom(iso)} />
            <DateField label={t("income.activeTo")} value={m.activeTo} onChange={m.setActiveTo} optional />
          </>
        )}
      </Card>

      <Card>
        <AccountShares rows={m.shares} onChange={m.setShares} accounts={m.accounts} amount={m.sourceAmount} currency={m.currency}
          label={t("cashMovements.usualSplit")} hint={t("cashMovements.usualSplitHint")} />
        <ToggleRow label={t("accounts.private")} value={m.isPrivate} onChange={m.setIsPrivate} />
      </Card>
      {m.id ? <Button testID="end-source" variant="secondary" title={t("income.endSource")} onPress={m.endSource} /> : null}

      {source ? (
        <>
          <Section title={t("income.history")}>
            <Group>
              {timeline.length === 0 ? (
                <Row last><ThemedText variant="subhead">{t("income.historyFrom", { amount: m.money(source.amount, source.currency), date: m.date(source.activeFrom) })}</ThemedText></Row>
              ) : null}
              {[...timeline].reverse().map((entry, index) => (
                <Row
                  key={entry.id}
                  last={index === timeline.length - 1}
                  trailing={timeline.length > 1 ? <Button variant="ghost" title={t("accounts.delete")} onPress={() => m.removeChange(entry)} /> : undefined}
                >
                  <ThemedText>{t("income.historyFrom", { amount: m.money(entry.amount, entry.currency), date: m.date(entry.effectiveFrom) })}</ThemedText>
                  {entry.note ? <ThemedText variant="caption">{entry.note}</ThemedText> : null}
                </Row>
              ))}
            </Group>
          </Section>
          <Section title={t("income.recordRaise")}>
            <Card>
              <TextField testID="raise-amount" label={t("income.newAmount")} keyboardType="decimal-pad" value={m.raiseAmount} onChangeText={m.setRaiseAmount} />
              <DateField label={t("income.effectiveFrom")} value={m.raiseFrom} onChange={(iso) => iso && m.setRaiseFrom(iso)} />
              <TextField testID="raise-note" label={t("income.note")} maxLength={120} value={m.raiseNote} onChangeText={m.setRaiseNote} />
              <Button testID="record-raise" variant="secondary" title={t("income.recordRaise")} disabled={!m.raiseAmount} onPress={m.recordRaise} />
            </Card>
          </Section>
        </>
      ) : null}
    </>
  )
}

const useStyles = makeStyles(() => ({
  pair: { flexDirection: "row", gap: spacing.md, alignItems: "flex-end" },
  wide: { flex: 3 },
  narrow: { flex: 2, gap: spacing.xs },
}))
