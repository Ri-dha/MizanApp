import { Stack } from "expo-router"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"

import { closeMonth, householdFigure, reopenMonth } from "@mizan/core/db/householdFigure"
import { attributionSinceLastClose } from "@mizan/core/db/netWorthView"
import { isMonthClosed, snapshotFor, trendPoints } from "@mizan/core/db/networth"
import { shiftKey } from "@mizan/core/domain/calendar/month"
import { formatMoney } from "@/utils/money"
import { syncNow } from "@mizan/core/sync/engine"
import { Button } from "@/components/button"
import { LineChart } from "@/components/charts/line-chart"
import { Notice } from "@/components/notice"
import { Group, Row } from "@/components/row"
import { Screen } from "@/components/screen"
import { ThemedText } from "@/components/themed-text"
import { useLiveQuery, useSession, useSyncStatus } from "@/hooks/use-core"
import { currentMonthKey, useNetWorth } from "@/hooks/use-views"
import { usePreferences } from "@/preferences"
import { spacing, useBrandColors } from "@/theme"
import { describeError } from "@/utils/errors"
import { formatMonthKey } from "@/utils/month"
import { useScreenTour } from "@/tours"
import { formatWhen } from "@/utils/dates"

const MONTHS_LISTED = 12
const ALWAYS_SHOWN = ["CASH", "METALS", "RECEIVABLES"]
const ATTRIBUTION_KEYS = ["total", "saving", "priceMovement", "debtRepayment", "newPurchases"] as const
const MICROS = 1e6

export function NetWorth() {
  const { t, i18n } = useTranslation()
  useScreenTour("networth")
  const brand = useBrandColors()
  const session = useSession()
  const sync = useSyncStatus()
  const base = session?.baseCurrency ?? "IQD"
  const startDay = session?.monthStartDay ?? 1
  const view = useNetWorth()
  const [busy, setBusy] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const household = useLiveQuery(async () => (session ? (await householdFigure(session)).result.netWorth : null), [session, view.current.netWorth], null)
  const attribution = attributionSinceLastClose(view, view.metals)
  const offline = sync.phase === "offline"
  const money = (v: number) => formatMoney(v, base, i18n.language)
  const signed = (v: number) => (v > 0 ? "+" : "") + money(v)
  const negative = (v: number) => (v < 0 ? { color: brand.destructive } : null)
  const rate = money(Math.round(Number(view.rateSet.usdIqdMicros) / MICROS))
  const rateKind = t(`metals.rateKinds.${String(view.rateSet.rateKind)}`)
  const prefs = usePreferences()
  const usdIqd = Number(view.rateSet.usdIqdMicros) / MICROS
  const thisMonth = currentMonthKey(startDay)
  const months = Array.from({ length: MONTHS_LISTED }, (_, i) => shiftKey(thisMonth, -i))
  const closedTrend = trendPoints(view.closes, view.snapshots)
  const when = (at: string) => formatWhen(at, i18n.language)

  async function act(monthKey: string, action: "close" | "reopen") {
    if (!session) return
    setBusy(monthKey)
    try {
      if (action === "close") await closeMonth(session, monthKey)
      else await reopenMonth(monthKey)
      void syncNow()
      setMessage(t(action === "close" ? "networth.closed" : "networth.reopened", { month: formatMonthKey(monthKey, i18n.language) }))
    } catch (e) {
      setMessage(describeError(e))
    } finally {
      setBusy(null)
    }
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: t("networth.title") }} />
      {message ? <Notice>{message}</Notice> : null}

      <View style={styles.section}>
        <ThemedText variant="subhead">{t("networth.headline")}</ThemedText>
        <ThemedText testID="networth-value" variant="largeTitle" style={negative(view.current.netWorth)}>{money(view.current.netWorth)}</ThemedText>
        {prefs.showUsd && usdIqd > 0 ? <ThemedText variant="title">{`≈ ${formatMoney(Math.round((view.current.netWorth / usdIqd) * 100), "USD", i18n.language)} (${rateKind})`}</ThemedText> : null}
        <ThemedText variant="caption">{t("networth.formula")}</ThemedText>
        {household !== null && household !== view.current.netWorth ? <ThemedText variant="subhead">{t("networth.householdFigure", { value: money(household) })}</ThemedText> : null}
      </View>

      <View style={styles.section}>
        <Group>
          <Row trailing={<ThemedText variant="headline">{money(view.current.totalAssets)}</ThemedText>}>
            <ThemedText variant="headline">{t("networth.assets")}</ThemedText>
            <ThemedText variant="caption">{t("networth.liquidLine", { liquid: money(view.current.liquidAssets), illiquid: money(view.current.illiquidAssets) })}</ThemedText>
          </Row>
          {view.current.composition.filter((share) => share.amount !== 0 || ALWAYS_SHOWN.includes(share.assetClass)).map((share) => (
            <Row key={share.assetClass} trailing={<ThemedText>{money(share.amount)}</ThemedText>}>
              <ThemedText>{`${t(`networth.classes.${share.assetClass}`)} · ${share.percent}%`}</ThemedText>
            </Row>
          ))}
          <Row last trailing={<ThemedText variant="headline">{money(view.current.totalLiabilities)}</ThemedText>}>
            <ThemedText variant="headline">{t("networth.liabilities")}</ThemedText>
          </Row>
        </Group>
        <ThemedText variant="caption">{t("networth.ratesInUse", { rate, kind: rateKind, gold: String(view.rateSet.xauSource) })}</ThemedText>
      </View>

      {attribution ? (
        <View style={styles.section}>
          <ThemedText variant="headline">{t("networth.attributionTitle", { month: formatMonthKey(attribution.since, i18n.language) })}</ThemedText>
          <ThemedText variant="caption">{t("networth.attributionBody")}</ThemedText>
          <Group>
            {ATTRIBUTION_KEYS.map((key, index) => (
              <Row key={key} last={index === ATTRIBUTION_KEYS.length - 1} trailing={<ThemedText variant={key === "total" ? "headline" : "body"} style={negative(attribution[key])}>{signed(attribution[key])}</ThemedText>}>
                <ThemedText variant={key === "total" ? "headline" : "body"}>{t(`networth.attribution.${key}`)}</ThemedText>
              </Row>
            ))}
          </Group>
        </View>
      ) : null}

      <View style={styles.section}>
        <ThemedText variant="headline">{t("networth.trend")}</ThemedText>
        <ThemedText variant="caption">{t("networth.trendBody")}</ThemedText>
        <LineChart
          testID="networth-trend"
          labels={[...closedTrend.map((p) => formatMonthKey(p.monthKey, i18n.language)), t("networth.now")]}
          series={[{ key: "netWorth", label: t("networth.title"), colour: brand.primary, values: [...closedTrend.map((p) => p.netWorth), view.current.netWorth] }]}
        />
      </View>

      <View style={styles.section}>
        <ThemedText variant="headline">{t("networth.months")}</ThemedText>
        <ThemedText variant="caption">{t("networth.monthsBody")}</ThemedText>
        <Group>
          {months.map((key, index) => {
            const closed = isMonthClosed(key, view.closes)
            const snapshot = snapshotFor(key, view.closes, view.snapshots)
            return (
              <Row
                key={key}
                testID={`month-${key}`}
                last={index === months.length - 1}
                trailing={
                  <Button
                    testID={`${closed ? "reopen" : "close"}-${key}`}
                    variant={closed ? "secondary" : "primary"}
                    title={closed ? t("networth.reopen") : t("networth.close")}
                    loading={busy === key}
                    disabled={offline || busy !== null}
                    onPress={() => void act(key, closed ? "reopen" : "close")}
                  />
                }
              >
                <ThemedText>{closed ? `${formatMonthKey(key, i18n.language)} · ${t("networth.closedBadge")}` : formatMonthKey(key, i18n.language)}</ThemedText>
                {snapshot && closed ? (
                  <ThemedText variant="caption">
                    {t("networth.snapshotLine", { value: money(snapshot.netWorth), at: when(snapshot.takenAt), rate: money(Math.round(Number(snapshot.rateSet.usdIqdMicros ?? 0) / MICROS)) })}
                  </ThemedText>
                ) : null}
              </Row>
            )
          })}
        </Group>
        {offline ? <ThemedText variant="caption">{t("networth.needsOnline")}</ThemedText> : null}
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  section: { gap: spacing.sm },
})
