import { useTranslation } from "react-i18next"
import { View } from "react-native"

import { Button } from "@/components/button"
import { Card, Section, SectionTitle } from "@/components/soft-kit"
import { ThemedText } from "@/components/themed-text"
import { makeStyles, spacing } from "@/theme"
import type { DealerProductsModel } from "../use-dealer-products"

/** Soft: a card per product group, each product on a row with what the dealer pays and charges at the end. */
export function DealerProductsSoft({ model }: { model: DealerProductsModel }) {
  const { t } = useTranslation()
  const styles = useStyles()
  return (
    <Section title={t("metals.dealerProducts")} note={model.body} action={<Button testID="toggle-dealer" variant="ghost" title={model.open ? t("metals.hide") : t("metals.show")} onPress={model.toggle} />}>
      {model.open
        ? model.groups.map((group) => (
            <Card key={group.key} flush>
              <View style={styles.head}><SectionTitle>{group.title}</SectionTitle></View>
              {group.items.map((item, index) => (
                <View key={item.id} style={[styles.row, index === group.items.length - 1 ? null : styles.divider]}>
                  <ThemedText style={styles.name}>{item.name}</ThemedText>
                  <View style={styles.figures}>
                    <ThemedText variant="caption">{`${t("metals.dealerPays")} `}<ThemedText style={styles.figure}>{item.pays}</ThemedText></ThemedText>
                    <ThemedText variant="caption">{`${t("metals.dealerCharges")} `}<ThemedText style={styles.figure}>{item.charges}</ThemedText></ThemedText>
                  </View>
                </View>
              ))}
            </Card>
          ))
        : null}
    </Section>
  )
}

const useStyles = makeStyles((colors) => ({
  head: { paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: spacing.xs },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginStart: spacing.md, paddingEnd: spacing.md, paddingVertical: spacing.sm + 2 },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.separator },
  name: { flex: 1 },
  figures: { alignItems: "flex-end" },
  figure: { fontSize: 13, fontWeight: "600", fontVariant: ["tabular-nums"], color: colors.label },
}))
