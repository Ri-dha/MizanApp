import { useTranslation } from "react-i18next"

import { AccountField } from "@/components/account-field"
import { Button } from "@/components/button"
import { DateField } from "@/components/date-field"
import { Group, Row } from "@/components/row"
import { Bar, Card, HeroAmount, Section, SectionTitle } from "@/components/soft-kit"
import { TextField } from "@/components/text-field"
import { ThemedText } from "@/components/themed-text"
import type { DebtDetailModel } from "../use-debt-detail-screen"

/** Soft: the balance as the hero with how much is paid off, then a payment, the what-if and the ledger. */
export function DebtDetailSoft({ model: m }: { model: DebtDetailModel }) {
  const { t } = useTranslation()
  const { debt, payoff, withExtra, ledger } = m
  return (
    <>
      <Card>
        <SectionTitle>{t("debts.balance")}</SectionTitle>
        <HeroAmount testID="debt-balance" tone={debt.direction === "OWING" && m.active ? "danger" : undefined}>{m.money(m.balance)}</HeroAmount>
        {debt.principal > 0 ? (
          <>
            <Bar thick percent={m.paidPercent} tone="ok" />
            <ThemedText variant="caption">{t("debts.paidOff", { paid: m.money(Math.max(0, debt.principal - m.balance)), total: m.money(debt.principal) })}</ThemedText>
          </>
        ) : null}
        <ThemedText variant="subhead">{m.outlook}</ThemedText>
      </Card>

      {m.active ? (
        <Section title={t("debts.recordPayment")}>
          <Card>
            <TextField testID="debt-payment-amount" label={t("income.amount")} keyboardType="decimal-pad" placeholder={m.paymentPlaceholder} value={m.amount} onChangeText={m.setAmount} />
            <DateField label={t("bills.paidOnLabel")} value={m.paidOn} onChange={(iso) => iso && m.setPaidOn(iso)} />
            <AccountField testID="payment-account" label={debt.direction === "OWING" ? t("cashMovements.paidFrom") : t("debts.repaidInto")}
              value={m.accountId} onChange={m.setAccountId} accounts={m.accounts} />
            <Button testID="record-payment" title={t("debts.recordPayment")} onPress={m.pay} />
          </Card>
        </Section>
      ) : null}

      {m.active && !payoff.neverClears ? (
        <Section title={t("debts.whatIf")}>
          <Card>
            <TextField testID="debt-extra" label={t("debts.extraPerMonth")} keyboardType="decimal-pad" value={m.extra} onChangeText={m.setExtra} />
            {withExtra && !withExtra.neverClears ? (
              <ThemedText variant="subhead">{t("debts.whatIfResult", { months: payoff.months - withExtra.months, interest: m.money(payoff.totalInterest - withExtra.totalInterest) })}</ThemedText>
            ) : null}
          </Card>
        </Section>
      ) : null}

      <Section title={t("debts.ledger")}>
        <Group>
          {ledger.length === 0 ? <Row last><ThemedText variant="subhead">{t("debts.noPayments")}</ThemedText></Row> : null}
          {ledger.map((payment, index) => (
            <Row
              key={payment.id}
              last={index === ledger.length - 1}
              trailing={<Button testID={`undo-payment-${payment.id}`} variant="ghost" title={t("bills.undo")} onPress={() => m.undo(payment)} />}
            >
              <ThemedText>{m.money(payment.amount)}</ThemedText>
              <ThemedText variant="caption">
                {`${m.date(payment.paidOn)} · ${t("debts.principalPart", { amount: m.money(payment.principalComponent) })}`}
                {payment.interestComponent ? ` · ${t("debts.interestPart", { amount: m.money(payment.interestComponent) })}` : ""}
              </ThemedText>
            </Row>
          ))}
        </Group>
      </Section>
    </>
  )
}
