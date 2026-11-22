import { useTranslation } from "react-i18next"
import { View } from "react-native"

import { Button } from "@/components/button"
import { LinkRow } from "@/components/link-row"
import { Notice } from "@/components/notice"
import { Group, Row } from "@/components/row"
import { Badge, Card, HeroAmount, Section } from "@/components/soft-kit"
import { ThemedText } from "@/components/themed-text"
import { makeStyles, spacing, type } from "@/theme"
import { DealerProducts } from "../dealer-products"
import { SellOrHold } from "../sell-or-hold"
import type { MetalsScreenModel } from "../use-metals-screen"

/** Soft: the gain in a gold card, the holdings with cost and worth on their own lines, then today's prices and the lots. */
export function MetalsSoft({ model }: { model: MetalsScreenModel }) {
  const { t } = useTranslation()
  const styles = useStyles()
  return (
    <>
      {model.message ? <Notice>{model.message}</Notice> : null}
      <Card style={styles.gold}>
        <ThemedText variant="headline" style={styles.goldText}>{t("metals.portfolio")}</ThemedText>
        <HeroAmount testID="metals-gain" tone={model.gainNegative ? "danger" : "ok"}>{model.gain}</HeroAmount>
        <ThemedText variant="caption">{model.totalsLine}</ThemedText>
        <ThemedText variant="caption">{model.excludingMaking}</ThemedText>
      </Card>

      <Section title={t("metals.lots")}>
        <Group>
          {model.lines.length === 0 ? <Row last><ThemedText variant="subhead">{t("metals.noLots")}</ThemedText></Row> : null}
          {model.lines.map((line, index) => (
            <Row key={line.key} last={index === model.lines.length - 1} trailing={<ThemedText style={[type.amount, line.negative ? styles.negative : styles.positive]}>{line.gain}</ThemedText>}>
              <ThemedText variant="headline">{line.name}</ThemedText>
              <ThemedText variant="caption">{line.cost}</ThemedText>
              <ThemedText variant="caption">{line.value}</ThemedText>
            </Row>
          ))}
        </Group>
        <View style={styles.actions}>
          {model.sells.map((sell) => <Button key={sell.metal} testID={`sell-${sell.metal}`} variant="secondary" title={sell.title} disabled={sell.disabled} onPress={sell.open} />)}
        </View>
        {model.lots.length > 0 ? (
          <Group>
            {model.lots.map((lot, index) => (
              <LinkRow
                key={lot.id}
                testID={`lot-${lot.id}`}
                href={lot.href}
                last={index === model.lots.length - 1}
                trailing={<View style={styles.end}><ThemedText style={type.amount}>{lot.value}</ThemedText><ThemedText variant="caption" style={lot.negative ? styles.negative : styles.positive}>{lot.gain}</ThemedText></View>}
              >
                <ThemedText numberOfLines={1}>{lot.name}</ThemedText>
                <ThemedText variant="caption" numberOfLines={2}>{lot.detail}</ThemedText>
              </LinkRow>
            ))}
          </Group>
        ) : null}
      </Section>

      <Section title={t("metals.priceTable")} note={model.priceNote}>
        <Group>
          {model.prices.map((row, index) => (
            <Row key={row.key} last={index === model.prices.length - 1} trailing={<ThemedText style={type.amount}>{row.perGram}</ThemedText>}>
              <ThemedText>{row.name}</ThemedText>
              <ThemedText variant="caption">{row.detail}</ThemedText>
            </Row>
          ))}
        </Group>
        <Button testID="refresh-prices" variant="secondary" title={t("metals.refresh")} loading={model.refreshing} onPress={model.refresh} />
      </Section>

      {model.dinar ? <SellOrHold view={model.view} currency={model.base} /> : null}
      {model.dinar ? <DealerProducts currency={model.base} /> : null}

      <Section title={t("metals.prices")}>
        <Group>
          {model.sources.map((source, index) => (
            <Row key={source.key} last={index === model.sources.length - 1} trailing={<ThemedText variant="subhead">{source.source}</ThemedText>}>
              <ThemedText>{source.label}</ThemedText>
              {source.stale ? <Badge tone="warn">{t("metals.stale")}</Badge> : null}
            </Row>
          ))}
        </Group>
        <Group>
          <LinkRow testID="metals-explain" href="/metal-explain"><ThemedText>{t("metals.howCalculated")}</ThemedText></LinkRow>
          <LinkRow testID="metals-override" href="/metal-override"><ThemedText>{t("metals.enterPrice")}</ThemedText></LinkRow>
          <LinkRow testID="metals-zakat" href="/metal-zakat"><ThemedText>{t("zakat.open")}</ThemedText></LinkRow>
          <LinkRow testID="metals-settings" href="/metal-settings" last><ThemedText>{t("metals.settings")}</ThemedText></LinkRow>
        </Group>
      </Section>

      {model.sales.length > 0 ? (
        <Section title={t("metals.sales")}>
          <Group>
            {model.sales.map((sale, index) => (
              <Row key={sale.id} last={index === model.sales.length - 1} trailing={<Button testID={`undo-sale-${sale.id}`} variant="ghost" title={t("bills.undo")} onPress={sale.undo} />}>
                <ThemedText>{sale.name}</ThemedText>
                <ThemedText style={[type.amount, sale.negative ? styles.negative : styles.positive]}>{sale.gain}</ThemedText>
                <ThemedText variant="caption">{sale.detail}</ThemedText>
              </Row>
            ))}
          </Group>
        </Section>
      ) : null}
    </>
  )
}

const useStyles = makeStyles((colors) => ({
  gold: { backgroundColor: colors.goldSurface },
  goldText: { color: colors.gold },
  actions: { flexDirection: "row", gap: spacing.sm, flexWrap: "wrap" },
  end: { alignItems: "flex-end" },
  positive: { color: colors.success },
  negative: { color: colors.destructive },
}))
