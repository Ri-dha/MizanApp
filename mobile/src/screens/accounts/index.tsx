import { router, Stack } from "expo-router"
import { useTranslation } from "react-i18next"

import { formatMoney } from "@/utils/money"
import { Button } from "@/components/button"
import { LinkRow } from "@/components/link-row"
import { Group, Row } from "@/components/row"
import { Screen } from "@/components/screen"
import { ThemedText } from "@/components/themed-text"
import { useCashAccountsWithMovements } from "@/hooks/use-views"
import type { Movement } from "@mizan/core/db/cashMovements"
import type { CashAccount } from "@mizan/core/schema"
import { StyleSheet, View } from "react-native"
import { spacing } from "@/theme"

export function Accounts() {
  const { t, i18n } = useTranslation()
  const { accounts, movements } = useCashAccountsWithMovements()
  return (
    <Screen>
      <Stack.Screen options={{ title: t("accounts.title"), headerRight: () => (
        <View style={styles.actions}>
          {accounts.length > 1 ? <Button testID="open-transfer" variant="ghost" title={t("cashMovements.transfer")} onPress={() => router.push("/account-transfer")} /> : null}
          <Button testID="add-account" variant="ghost" title={t("accounts.add")} onPress={() => router.push("/account-edit")} />
        </View>
      ) }} />
      <Group>
        {accounts.length === 0 ? <Row last><ThemedText variant="subhead">{t("home.noAccounts")}</ThemedText></Row> : null}
        {accounts.map((account, index) => (
          <LinkRow
            key={account.id}
            testID={`account-${account.id}`}
            href={{ pathname: "/account-edit", params: { id: account.id } }}
            last={index === accounts.length - 1}
            trailing={<ThemedText variant="headline">{formatMoney(account.balance, account.currency, i18n.language)}</ThemedText>}
          >
            <ThemedText numberOfLines={1}>{account.name}</ThemedText>
            <ThemedText variant="caption" numberOfLines={1}>
              {[t(`accounts.kinds.${account.kind}`), account.institution, account.visibility === "PRIVATE" ? t("accounts.private") : null].filter(Boolean).join(" · ")}
            </ThemedText>
            <MovedSince account={account} movements={movements} />
          </LinkRow>
        ))}
      </Group>
    </Screen>
  )
}

/** Why the balance differs from the one last set: the linked income and spending recorded since. */
function MovedSince({ account, movements }: { account: CashAccount; movements: Movement[] }) {
  const { t, i18n } = useTranslation()
  const mine = movements.filter((m) => m.cashAccountId === account.id)
  if (mine.length === 0) return null
  const money = (v: number) => formatMoney(v, account.currency, i18n.language)
  const income = mine.filter((m) => m.amount > 0).reduce((sum, m) => sum + m.amount, 0)
  const spending = mine.filter((m) => m.amount < 0).reduce((sum, m) => sum - m.amount, 0)
  const changes = [
    income > 0 ? t("cashMovements.movedIn", { amount: money(income) }) : null,
    spending > 0 ? t("cashMovements.movedOut", { amount: money(spending) }) : null,
  ].filter(Boolean).join(" · ")
  return <ThemedText testID={`moved-${account.id}`} variant="caption">{t("cashMovements.since", { changes })}</ThemedText>
}

const styles = StyleSheet.create({
  actions: { flexDirection: "row", gap: spacing.xs },
})
