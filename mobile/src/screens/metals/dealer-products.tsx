import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"

import { api, unwrap } from "@mizan/core/api/client"
import { readMeta, writeMeta } from "@mizan/core/db/meta"
import { formatMoney } from "@mizan/core/domain/money/format"
import { Button } from "@/components/button"
import { Group, Row } from "@/components/row"
import { ThemedText } from "@/components/themed-text"
import { spacing } from "@/theme"

interface Item { id: string; name_ar: string; name_en: string; bid_iqd: number; ask_iqd: number }
interface ProductGroup { key: string; title_ar: string; title_en: string; items: Item[] }
interface Catalogue { source: string; asOf: string; groups: ProductGroup[] }

const KEY = "market.catalogue"

/** The dealer's bars and coins with what they pay (bid) and charge (ask), as the feed lists them. */
export function DealerProducts({ currency }: { currency: string }) {
  const { t, i18n } = useTranslation()
  const [catalogue, setCatalogue] = useState<Catalogue | null>(null)
  const [open, setOpen] = useState(false)
  const ar = i18n.language === "ar"
  const money = (v: number) => formatMoney(Math.round(v), currency, i18n.language)

  useEffect(() => {
    let live = true
    void (async () => {
      const cached = await readMeta<Catalogue>(KEY)
      if (cached && live) setCatalogue(cached)
      try {
        const response = await unwrap(api().GET("/api/v1/market/catalogue"))
        if (response?.catalogue) {
          const next = { source: response.source ?? "", asOf: response.asOf ?? "", groups: response.catalogue as unknown as ProductGroup[] }
          await writeMeta(KEY, next)
          if (live) setCatalogue(next)
        }
      } catch {
        // offline or no dealer feed; the cached list stands
      }
    })()
    return () => {
      live = false
    }
  }, [])

  if (!catalogue) return null
  const at = new Intl.DateTimeFormat(ar ? "ar-IQ-u-nu-latn" : "en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(catalogue.asOf))
  return (
    <View style={styles.section}>
      <ThemedText variant="headline">{t("metals.dealerProducts")}</ThemedText>
      <ThemedText variant="caption">{t("metals.dealerProductsBody", { source: catalogue.source, at })}</ThemedText>
      <Button testID="toggle-dealer" variant="ghost" title={open ? t("metals.hide") : t("metals.show")} style={styles.start} onPress={() => setOpen(!open)} />
      {open
        ? catalogue.groups.map((group) => (
            <View key={group.key} style={styles.section}>
              <ThemedText variant="subhead">{ar ? group.title_ar : group.title_en}</ThemedText>
              <Group>
                {group.items.map((item, index) => (
                  <Row key={item.id} last={index === group.items.length - 1}>
                    <ThemedText>{ar ? item.name_ar : item.name_en}</ThemedText>
                    <ThemedText variant="caption">{`${t("metals.dealerPays")} ${money(item.bid_iqd)} · ${t("metals.dealerCharges")} ${money(item.ask_iqd)}`}</ThemedText>
                  </Row>
                ))}
              </Group>
            </View>
          ))
        : null}
    </View>
  )
}

const styles = StyleSheet.create({
  section: { gap: spacing.sm },
  start: { alignSelf: "flex-start" },
})
