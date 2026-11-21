import { useCashAccounts } from "@/hooks/use-views"
import { router, Stack } from "expo-router"
import { useTranslation } from "react-i18next"

import { formatMoney } from "@/utils/money"
import { Button } from "@/components/button"
import { LinkRow } from "@/components/link-row"
import { Group, Row } from "@/components/row"
import { Screen } from "@/components/screen"
import { ThemedText } from "@/components/themed-text"
import { useLiveQuery } from "@/hooks/use-core"

export function Accounts() {
  const { t, i18n } = useTranslation()
  const accounts = useCashAccounts()
  return (
    <Screen>
      <Stack.Screen options={{ title: t("accounts.title"), headerRight: () => <Button testID="add-account" variant="ghost" title={t("accounts.add")} onPress={() => router.push("/account-edit")} /> }} />
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
          </LinkRow>
        ))}
      </Group>
    </Screen>
  )
}
