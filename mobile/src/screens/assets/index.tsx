import { router, Stack } from "expo-router"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"

import { currentValue, liveAssets, liveValuations, realisedGain, removeValuation, unsellAsset, valuationsOf } from "@mizan/core/db/assets"
import { todayIso } from "@mizan/core/domain/calendar/month"
import { formatMoney } from "@/utils/money"
import type { Asset, AssetType } from "@mizan/core/schema"
import { rows } from "@mizan/core/store/store"
import { Button } from "@/components/button"
import { Group, Row } from "@/components/row"
import { Screen } from "@/components/screen"
import { ThemedText } from "@/components/themed-text"
import { useLiveQuery, useSession } from "@/hooks/use-core"
import { usePreferences } from "@/preferences"
import { spacing, useBrandColors } from "@/theme"
import { SHORT_DATE, formatDay } from "@/utils/dates"
import { useScreenTour } from "@/tours"

export const ASSET_TYPES: AssetType[] = ["VEHICLE", "PROPERTY", "ELECTRONICS", "EQUIPMENT", "FURNITURE", "LIVESTOCK", "OTHER"]
const RECENT_VALUATIONS = 3

async function runningCosts(): Promise<Record<string, number>> {
  const expenses = await rows("transactions", (x) => x.deletedAt === null && x.type === "EXPENSE" && !!x.assetId)
  const totals: Record<string, number> = {}
  for (const row of expenses) totals[row.assetId!] = (totals[row.assetId!] ?? 0) + row.baseAmount
  return totals
}

export function Assets() {
  const { t, i18n } = useTranslation()
  useScreenTour("assets")
  const brand = useBrandColors()
  const session = useSession()
  const base = session?.baseCurrency ?? "IQD"
  const assets = useLiveQuery(liveAssets, [], [])
  const valuations = useLiveQuery(liveValuations, [], [])
  const costs = useLiveQuery(runningCosts, [], {})
  const [showSold, setShowSold] = useState(false)
  const prefs = usePreferences()
  const today = todayIso()
  const money = (v: number, currency = base) => formatMoney(v, currency, i18n.language)
  const signed = (v: number, currency = base) => (v > 0 ? "+" : "") + money(v, currency)
  const date = (iso: string) => formatDay(iso, i18n.language, SHORT_DATE)
  const held = assets.filter((a) => a.status === "HELD")
  const sold = assets.filter((a) => a.status === "SOLD")
  const totalBase = held.reduce((sum, a) => sum + currentValue(a, valuations, today).baseValue, 0)
  const negative = (v: number) => (v < 0 ? { color: brand.destructive } : null)
  const openAction = (kind: "value" | "sell", asset: Asset) => router.push({ pathname: "/asset-action", params: { id: asset.id, kind } })

  function card(asset: Asset) {
    const value = currentValue(asset, valuations, today)
    const history = valuationsOf(asset.id, valuations).slice(0, RECENT_VALUATIONS)
    const stale = value.monthsSinceBaseline >= prefs.valuationReminderMonths
    const change = value.value - asset.purchasePrice
    const cost = costs[asset.id] ?? 0
    const badges = [asset.liquidity === "ILLIQUID" ? t("assets.illiquidBadge") : null, asset.visibility === "PRIVATE" ? t("accounts.private") : null, stale ? t("assets.staleBadge") : null].filter(Boolean)
    const attributes = Object.entries(asset.attributes).map(([k, v]) => `${t(`assets.attributes.${k}`)}: ${v}`).join(" · ")
    return (
      <Group key={asset.id}>
        <View testID={`asset-${asset.id}`} style={styles.card}>
          <View style={styles.title}>
            <ThemedText variant="headline" style={styles.name} onPress={() => router.push({ pathname: "/asset-edit", params: { id: asset.id } })}>{asset.name}</ThemedText>
            <ThemedText variant="headline">{money(value.value, asset.currency)}</ThemedText>
          </View>
          {attributes ? <ThemedText variant="caption">{attributes}</ThemedText> : null}
          {badges.length > 0 ? <ThemedText variant="caption">{badges.join(" · ")}</ThemedText> : null}
          <ThemedText variant="subhead">
            {t(value.baselineSource === "VALUATION" ? "assets.valueFromValuation" : "assets.valueFromPurchase", { date: date(value.baselineDate) })}
            {asset.depreciationMethod !== "NONE" ? ` · ${t("assets.depreciatedLine", { months: value.monthsSinceBaseline, rate: asset.annualRateBasisPoints / 100 })}` : ""}
          </ThemedText>
          <ThemedText variant="subhead" style={negative(change)}>{t("assets.sincePurchase", { amount: signed(change, asset.currency) })}</ThemedText>
          {cost > 0 ? <ThemedText variant="subhead">{t("assets.tco", { costs: money(cost), total: money(asset.purchasePrice + cost - value.value, asset.currency) })}</ThemedText> : null}
          <View style={styles.actions}>
            <Button testID={`value-${asset.id}`} title={t("assets.addValuation")} onPress={() => openAction("value", asset)} />
            <Button testID={`sell-${asset.id}`} variant="secondary" title={t("assets.sell")} onPress={() => openAction("sell", asset)} />
          </View>
        </View>
        {history.map((v, index) => (
          <Row key={v.id} last={index === history.length - 1} trailing={<Button testID={`undo-valuation-${v.id}`} variant="ghost" title={t("bills.undo")} onPress={() => void removeValuation(v.id)} />}>
            <ThemedText>{money(v.value, asset.currency)}</ThemedText>
            <ThemedText variant="caption">{`${date(v.valuedOn)}${v.note ? ` · ${v.note}` : ""}`}</ThemedText>
          </Row>
        ))}
      </Group>
    )
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: t("assets.title"), headerRight: () => <Button testID="add-asset" variant="ghost" title={t("assets.add")} onPress={() => router.push("/asset-edit")} /> }} />
      <View style={styles.section}>
        <ThemedText variant="subhead">{t("assets.totalTitle")}</ThemedText>
        <ThemedText testID="assets-total" variant="largeTitle">{money(totalBase)}</ThemedText>
        <ThemedText variant="caption">{t("assets.totalBody", { count: held.length })}</ThemedText>
      </View>
      {held.length === 0 ? <ThemedText variant="subhead">{t("assets.none")}</ThemedText> : null}
      {ASSET_TYPES.filter((type) => held.some((a) => a.type === type)).map((type) => (
        <View key={type} style={styles.section}>
          <ThemedText variant="headline">{t(`assets.types.${type}`)}</ThemedText>
          {held.filter((a) => a.type === type).map(card)}
        </View>
      ))}
      {sold.length > 0 ? (
        <View style={styles.section}>
          <Button testID="toggle-sold" variant="ghost" title={t("assets.soldToggle", { count: sold.length })} style={styles.start} onPress={() => setShowSold(!showSold)} />
          {showSold ? (
            <Group>
              {sold.map((asset, index) => {
                const gain = realisedGain(asset) ?? 0
                return (
                  <Row key={asset.id} last={index === sold.length - 1} trailing={<Button testID={`unsell-${asset.id}`} variant="ghost" title={t("bills.undo")} onPress={() => void unsellAsset(asset.id)} />}>
                    <ThemedText>{asset.name}</ThemedText>
                    <ThemedText variant="caption">{t("assets.soldLine", { date: asset.soldOn ? date(asset.soldOn) : "", price: money(asset.salePrice ?? 0, asset.currency) })}</ThemedText>
                    <ThemedText variant="headline" style={negative(gain)}>{signed(gain, asset.currency)}</ThemedText>
                  </Row>
                )
              })}
            </Group>
          ) : null}
        </View>
      ) : null}
    </Screen>
  )
}

const styles = StyleSheet.create({
  section: { gap: spacing.sm },
  card: { padding: spacing.md, gap: spacing.xs },
  title: { flexDirection: "row", justifyContent: "space-between", gap: spacing.sm },
  name: { flex: 1 },
  actions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.xs },
  start: { alignSelf: "flex-start" },
})
