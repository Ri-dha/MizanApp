import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"

import { Button } from "@/components/button"
import { Group, Row } from "@/components/row"
import { Badge, Card, HeroAmount, Line, Section } from "@/components/soft-kit"
import { ThemedText } from "@/components/themed-text"
import { makeStyles, spacing, type } from "@/theme"
import type { AssetsScreenModel } from "../use-assets-screen"

/** Soft: the total in a hero card, then one card per asset with its badges, worth, change and its last valuations under a rule. */
export function AssetsSoft({ model }: { model: AssetsScreenModel }) {
  const { t } = useTranslation()
  const styles = useStyles()
  return (
    <>
      <Card>
        <ThemedText variant="headline">{t("assets.totalTitle")}</ThemedText>
        <HeroAmount testID="assets-total">{model.total}</HeroAmount>
        <ThemedText variant="caption">{t("assets.totalBody", { count: model.count })}</ThemedText>
      </Card>
      {model.count === 0 ? <ThemedText variant="subhead">{t("assets.none")}</ThemedText> : null}
      {model.groups.map((group) => (
        <Section key={group.type} title={group.title}>
          {group.cards.map((asset) => (
            <Card key={asset.id} testID={`asset-${asset.id}`}>
              <View style={styles.head}>
                <View style={styles.grow}>
                  <ThemedText variant="headline" onPress={asset.edit}>{asset.name}</ThemedText>
                  {asset.attributes ? <ThemedText variant="caption">{asset.attributes}</ThemedText> : null}
                </View>
                {asset.illiquid ? <Badge>{t("assets.illiquidBadge")}</Badge> : null}
                {asset.isPrivate ? <Badge>{t("accounts.private")}</Badge> : null}
              </View>
              {asset.stale ? <Badge tone="warn">{t("assets.staleBadge")}</Badge> : null}
              <Line label={t("metals.valueNow")} value={asset.value} strong />
              {asset.inBase ? <ThemedText testID={`asset-in-base-${asset.id}`} variant="subhead" style={styles.inBase}>{asset.inBase}</ThemedText> : null}
              <ThemedText variant="subhead" style={asset.lost ? styles.negative : null}>{asset.sincePurchase}</ThemedText>
              <ThemedText variant="caption">{asset.basis}</ThemedText>
              {asset.tco ? <ThemedText variant="caption">{asset.tco}</ThemedText> : null}
              <View style={styles.actions}>
                <Button testID={`value-${asset.id}`} title={t("assets.addValuation")} onPress={asset.addValuation} />
                <Button testID={`sell-${asset.id}`} variant="secondary" title={t("assets.sell")} onPress={asset.sell} />
              </View>
              {asset.history.map((entry) => (
                <View key={entry.id} style={styles.entry}>
                  <View style={styles.grow}>
                    <ThemedText style={type.amount}>{entry.value}</ThemedText>
                    <ThemedText variant="caption">{entry.detail}</ThemedText>
                  </View>
                  <Button testID={`undo-valuation-${entry.id}`} variant="ghost" title={t("bills.undo")} onPress={entry.undo} />
                </View>
              ))}
            </Card>
          ))}
        </Section>
      ))}
      {model.sold.length > 0 ? (
        <View style={styles.sold}>
          <Button testID="toggle-sold" variant="ghost" title={t("assets.soldToggle", { count: model.sold.length })} style={styles.start} onPress={model.toggleSold} />
          {model.showSold ? (
            <Group>
              {model.sold.map((asset, index) => (
                <Row key={asset.id} last={index === model.sold.length - 1} trailing={<Button testID={`unsell-${asset.id}`} variant="ghost" title={t("bills.undo")} onPress={asset.undo} />}>
                  <ThemedText>{asset.name}</ThemedText>
                  <ThemedText variant="caption">{asset.detail}</ThemedText>
                  <ThemedText style={[type.amount, asset.lost ? styles.negative : null]}>{asset.gain}</ThemedText>
                </Row>
              ))}
            </Group>
          ) : null}
        </View>
      ) : null}
    </>
  )
}

const useStyles = makeStyles((colors) => ({
  head: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm },
  grow: { flex: 1 },
  inBase: { alignSelf: "flex-end" },
  actions: { flexDirection: "row", gap: spacing.sm },
  entry: { flexDirection: "row", alignItems: "center", gap: spacing.sm, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.separator, paddingTop: spacing.sm },
  sold: { gap: spacing.sm },
  start: { alignSelf: "flex-start" },
  negative: { color: colors.destructive },
}))
