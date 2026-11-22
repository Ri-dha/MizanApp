import { useTranslation } from "react-i18next"
import { View } from "react-native"

import { LinkRow } from "@/components/link-row"
import { Group, Row } from "@/components/row"
import { Card, HeroAmount, Section } from "@/components/soft-kit"
import { ThemedText } from "@/components/themed-text"
import { makeStyles, radius, spacing, type, useColors } from "@/theme"
import type { AccountsScreenModel } from "../use-accounts-screen"

/** Soft: the cash total with a bar split by kind of account, then one group per kind. */
export function AccountsSoft({ model }: { model: AccountsScreenModel }) {
  const { t } = useTranslation()
  const styles = useStyles()
  const colors = useColors()
  const colourOf = (index: number) => colors.buckets[index % colors.buckets.length]
  return (
    <>
      {model.total ? (
        <Card>
          <ThemedText variant="headline">{t("accounts.title")}</ThemedText>
          <HeroAmount>{model.total}</HeroAmount>
          {model.shares.length > 1 ? (
            <>
              <View style={styles.split}>
                {model.shares.map((share, index) => <View key={share.kind} style={[styles.part, { flexGrow: Math.max(1, share.percent), backgroundColor: colourOf(index) }]} />)}
              </View>
              <View style={styles.legend}>
                {model.shares.map((share, index) => (
                  <View key={share.kind} style={styles.key}>
                    <View style={[styles.swatch, { backgroundColor: colourOf(index) }]} />
                    <ThemedText variant="caption">{share.label}</ThemedText>
                  </View>
                ))}
              </View>
            </>
          ) : null}
        </Card>
      ) : null}
      {model.rows.length === 0 ? <Group><Row last><ThemedText variant="subhead">{t("home.noAccounts")}</ThemedText></Row></Group> : null}
      {model.groups.map((group) => (
        <Section key={group.kind} title={group.title}>
          <Group>
            {group.rows.map((account, index) => (
              <LinkRow key={account.id} testID={`account-${account.id}`} href={account.href} last={index === group.rows.length - 1} trailing={<ThemedText style={[type.amount, styles.balance]}>{account.balance}</ThemedText>}>
                <ThemedText variant="headline" numberOfLines={1}>{account.name}</ThemedText>
                <ThemedText variant="caption" numberOfLines={1}>{account.detail}</ThemedText>
                {account.moved ? <ThemedText testID={`moved-${account.id}`} variant="caption">{account.moved}</ThemedText> : null}
              </LinkRow>
            ))}
          </Group>
        </Section>
      ))}
    </>
  )
}

const useStyles = makeStyles(() => ({
  split: { flexDirection: "row", gap: 2, height: 10 },
  part: { flexBasis: 0, borderRadius: radius.full },
  legend: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  key: { flexDirection: "row", alignItems: "center", gap: spacing.xs + 2 },
  swatch: { width: 10, height: 10, borderRadius: 3 },
  balance: { fontWeight: "600" },
}))
