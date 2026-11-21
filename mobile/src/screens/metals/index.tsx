import { router, Stack } from "expo-router"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"

import { priceTable, realisedGain, undoSale } from "@mizan/core/db/metals"
import { fetchLiveQuotes } from "@mizan/core/market/prices"
import { formatMoney } from "@/utils/money"
import type { Metal } from "@mizan/core/schema"
import { Button } from "@/components/button"
import { LinkRow } from "@/components/link-row"
import { Notice } from "@/components/notice"
import { Group, Row } from "@/components/row"
import { Screen } from "@/components/screen"
import { ThemedText } from "@/components/themed-text"
import { useSession } from "@/hooks/use-core"
import { useMetals } from "@/hooks/use-views"
import { spacing, useBrandColors } from "@/theme"
import { describeError } from "@/utils/errors"
import { DealerProducts } from "./dealer-products"
import { SellOrHold } from "./sell-or-hold"
import { grams, wholeFromMicros } from "./format"
import { useScreenTour } from "@/tours"
import { formatWhen } from "@/utils/dates"

const METALS: Metal[] = ["GOLD", "SILVER"]
const USD_MINOR_PER_MICROS = 1e4

export function Metals() {
  const { t, i18n } = useTranslation()
  useScreenTour("metals")
  const brand = useBrandColors()
  const session = useSession()
  const base = session?.baseCurrency ?? "IQD"
  const view = useMetals()
  const [refreshing, setRefreshing] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const money = (v: number) => formatMoney(v, base, i18n.language)
  const usd = (micros: number) => formatMoney(Math.round(micros / USD_MINOR_PER_MICROS), "USD", i18n.language)
  const signed = (v: number) => (v > 0 ? "+" : "") + money(v)
  const when = (at: string) => formatWhen(at, i18n.language)
  const table = priceTable(view.prices, view.setting)
  const openLots = view.valued.filter((v) => v.remainingMg > 0)
  const totals = view.lines.reduce((acc, l) => ({ cost: acc.cost + l.costBasis, value: acc.value + l.valueNow, gain: acc.gain + l.gain, gainX: acc.gainX + l.gainExcludingMaking }), { cost: 0, value: 0, gain: 0, gainX: 0 })
  const gold = view.prices.spot.GOLD
  const gainColour = (v: number) => (v < 0 ? { color: brand.destructive } : null)

  async function refresh() {
    setRefreshing(true)
    try {
      await fetchLiveQuotes()
      setMessage(t("metals.refreshed"))
    } catch (e) {
      setMessage(describeError(e))
    } finally {
      setRefreshing(false)
    }
  }

  function spotLine(metal: Metal) {
    const spot = view.prices.spot[metal]
    if (spot.perGram24kOverrideMicros !== null) return `${money(wholeFromMicros(spot.perGram24kOverrideMicros))}/g`
    return `$${(spot.spotUsdPerOzMicros / 1e6).toFixed(2)}/oz`
  }

  const sourceLabel = (kind: string, label: string) => (kind === "override" ? t("metals.sources.override") : kind === "feed" || kind === "local" ? label : t("metals.sources.none"))

  return (
    <Screen>
      <Stack.Screen options={{ title: t("metals.title"), headerRight: () => <Button testID="add-lot" variant="ghost" title={t("metals.addLot")} onPress={() => router.push("/metal-lot")} /> }} />
      {message ? <Notice>{message}</Notice> : null}

      <View style={styles.section}>
        <ThemedText variant="headline">{t("metals.portfolio")}</ThemedText>
        <ThemedText variant="caption">
          {`${t("metals.costBasis")}: ${money(totals.cost)} · ${t("metals.valueNow")}: ${money(totals.value)}`}
          {view.setting?.valuationBasis === "BUYBACK" ? ` · ${t("metals.buybackBadge")}` : ""}
        </ThemedText>
        <ThemedText testID="metals-gain" variant="largeTitle" style={gainColour(totals.gain)}>{signed(totals.gain)}</ThemedText>
        <ThemedText variant="subhead">{t("metals.excludingMaking", { amount: signed(totals.gainX) })}</ThemedText>
        <Group>
          {view.lines.length === 0 ? <Row last><ThemedText variant="subhead">{t("metals.noLots")}</ThemedText></Row> : null}
          {view.lines.map((line, index) => (
            <Row key={`${line.metal}-${line.purityLabel}`} last={index === view.lines.length - 1} trailing={<ThemedText variant="headline" style={gainColour(line.gain)}>{signed(line.gain)}</ThemedText>}>
              <ThemedText>{`${t(`metals.metal.${line.metal}`)} ${line.purityLabel} · ${grams(line.weightMg, i18n.language)}`}</ThemedText>
              <ThemedText variant="caption">{`${t("metals.costBasis")} ${money(line.costBasis)} · ${t("metals.valueNow")} ${money(line.valueNow)}`}</ThemedText>
            </Row>
          ))}
        </Group>
        <View style={styles.actions}>
          {METALS.map((metal) => (
            <Button
              key={metal}
              testID={`sell-${metal}`}
              variant="secondary"
              title={t("metals.sell", { metal: t(`metals.metal.${metal}`) })}
              disabled={!openLots.some((v) => v.lot.metal === metal)}
              onPress={() => router.push({ pathname: "/metal-sell", params: { metal } })}
            />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText variant="headline">{t("metals.priceTable")}</ThemedText>
        <ThemedText variant="caption">
          {gold.source.at ? t("metals.priceTableBody", { at: when(gold.source.at), source: gold.source.label }) : t("metals.priceTableNoPrice")}
          {gold.source.stale ? ` · ${t("metals.stale")}` : ""}
        </ThemedText>
        <Group>
          {table.map((row, index) => (
            <Row
              key={`${row.metal}-${row.purityLabel}`}
              last={index === table.length - 1}
              trailing={<ThemedText variant="headline">{`${money(wholeFromMicros(row.perGramMicros))}/g`}</ThemedText>}
            >
              <ThemedText>{`${t(`metals.metal.${row.metal}`)} ${row.purityLabel}`}</ThemedText>
              <ThemedText variant="caption">
                {`${money(wholeFromMicros(row.perMithqalMicros))}/${t("metals.units.MITHQAL")} · ${usd(row.perGramUsdMicros)}/g`}
              </ThemedText>
            </Row>
          ))}
        </Group>
        <Button testID="refresh-prices" variant="secondary" title={t("metals.refresh")} loading={refreshing} onPress={() => void refresh()} />
      </View>

      <SellOrHold view={view} currency={base} />

      <DealerProducts currency={base} />

      <View style={styles.section}>
        <ThemedText variant="headline">{t("metals.prices")}</ThemedText>
        <Group>
          {METALS.map((metal) => (
            <Row key={metal} trailing={<ThemedText variant="subhead">{sourceLabel(view.prices.spot[metal].source.kind, view.prices.spot[metal].source.label)}</ThemedText>}>
              <ThemedText>{`${t(`metals.metal.${metal}`)}: ${spotLine(metal)}`}</ThemedText>
              {view.prices.spot[metal].source.stale ? <ThemedText variant="caption">{t("metals.stale")}</ThemedText> : null}
            </Row>
          ))}
          <Row last trailing={<ThemedText variant="subhead">{sourceLabel(view.prices.rateSource.kind, view.prices.rateSource.label)}</ThemedText>}>
            <ThemedText>{`USD → ${base} (${t(`metals.rateKinds.${view.prices.rateKind}`)}): ${money(wholeFromMicros(view.prices.usdIqdMicros))}`}</ThemedText>
          </Row>
        </Group>
        <Group>
          <LinkRow testID="metals-explain" href="/metal-explain"><ThemedText>{t("metals.howCalculated")}</ThemedText></LinkRow>
          <LinkRow testID="metals-override" href="/metal-override"><ThemedText>{t("metals.enterPrice")}</ThemedText></LinkRow>
          <LinkRow testID="metals-zakat" href="/metal-zakat"><ThemedText>{t("zakat.open")}</ThemedText></LinkRow>
          <LinkRow testID="metals-settings" href="/metal-settings" last><ThemedText>{t("metals.settings")}</ThemedText></LinkRow>
        </Group>
      </View>

      <View style={styles.section}>
        <ThemedText variant="headline">{t("metals.lots")}</ThemedText>
        <Group>
          {openLots.length === 0 ? <Row last><ThemedText variant="subhead">{t("metals.noLots")}</ThemedText></Row> : null}
          {openLots.map((v, index) => (
            <LinkRow
              key={v.lot.id}
              testID={`lot-${v.lot.id}`}
              href={{ pathname: "/metal-lot", params: { id: v.lot.id } }}
              last={index === openLots.length - 1}
              trailing={
                <View style={styles.end}>
                  <ThemedText variant="headline">{money(v.valueNow)}</ThemedText>
                  <ThemedText variant="caption" style={gainColour(v.gain)}>{`${signed(v.gain)}${v.gainPercent !== null ? ` (${v.gainPercent}%)` : ""}`}</ThemedText>
                </View>
              }
            >
              <ThemedText numberOfLines={1}>{`${t(`metals.metal.${v.lot.metal}`)} ${v.lot.purityLabel} · ${grams(v.remainingMg, i18n.language)} · ${t(`metals.forms.${v.lot.form}`)}`}</ThemedText>
              <ThemedText variant="caption" numberOfLines={2}>
                {`${v.lot.purchaseDate}${v.lot.dealer ? ` · ${v.lot.dealer}` : ""} · ${t("metals.perGram", { cost: money(v.costPerGramBase), now: money(v.perGramNowBase) })}`}
              </ThemedText>
            </LinkRow>
          ))}
        </Group>
      </View>

      {view.disposals.length > 0 ? (
        <View style={styles.section}>
          <ThemedText variant="headline">{t("metals.sales")}</ThemedText>
          <Group>
            {view.disposals.map((d, index) => {
              const r = realisedGain(d, view.disposalLots)
              return (
                <Row
                  key={d.id}
                  last={index === view.disposals.length - 1}
                  trailing={<Button testID={`undo-sale-${d.id}`} variant="ghost" title={t("bills.undo")} onPress={() => void undoSale(d, view.disposalLots)} />}
                >
                  <ThemedText>{`${d.soldOn} · ${t(`metals.metal.${d.metal}`)} ${grams(d.weightMg, i18n.language)}`}</ThemedText>
                  <ThemedText variant="headline" style={gainColour(r.gain)}>{signed(r.gain)}</ThemedText>
                  <ThemedText variant="caption">{`${t(`metals.methods.${d.method}`)} · ${t("metals.excludingMaking", { amount: signed(r.gainExcludingMaking) })}`}</ThemedText>
                </Row>
              )
            })}
          </Group>
        </View>
      ) : null}
    </Screen>
  )
}

const styles = StyleSheet.create({
  section: { gap: spacing.sm },
  actions: { flexDirection: "row", gap: spacing.sm, flexWrap: "wrap" },
  end: { alignItems: "flex-end" },
})
