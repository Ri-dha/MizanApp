import { useState } from "react"
import { useTranslation } from "react-i18next"

import { closeMonth, householdFigure, reopenMonth } from "@mizan/core/db/householdFigure"
import { attributionSinceLastClose, dollarRateMinor, dollarRateOf, inDollarCents } from "@mizan/core/db/netWorthView"
import { isMonthClosed, snapshotFor, trendPoints } from "@mizan/core/db/networth"
import { shiftKey } from "@mizan/core/domain/calendar/month"
import { syncNow } from "@mizan/core/sync/engine"
import { useLiveQuery, useSession, useSyncStatus } from "@/hooks/use-core"
import { currentMonthKey, useNetWorth } from "@/hooks/use-views"
import { usePreferences } from "@/preferences"
import { useScreenTour } from "@/tours"
import { formatWhen } from "@/utils/dates"
import { describeError } from "@/utils/errors"
import { formatMoney } from "@/utils/money"
import { formatMonthKey } from "@/utils/month"

const MONTHS_LISTED = 12
const ALWAYS_SHOWN = ["CASH", "METALS", "RECEIVABLES"]
const ATTRIBUTION_KEYS = ["total", "saving", "priceMovement", "debtRepayment", "newPurchases"] as const

/** Everything the Net worth screen knows and can do; the templates only decide how it is drawn (ADR styles-1). */
export function useNetWorthScreen() {
  const { t, i18n } = useTranslation()
  useScreenTour("networth")
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
  const rateKind = base === "IQD" ? t(`metals.rateKinds.${String(view.rateSet.rateKind)}`) : t("networth.worldRate")
  const prefs = usePreferences()
  const inUsd = inDollarCents(view.current.netWorth, base, view.rateSet)
  const thisMonth = currentMonthKey(startDay)
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

  return {
    message, offline,
    netWorth: money(view.current.netWorth),
    negative: view.current.netWorth < 0,
    inUsd: prefs.showUsd && inUsd !== null ? `≈ ${formatMoney(inUsd, "USD", i18n.language)} (${rateKind})` : null,
    household: household !== null && household !== view.current.netWorth ? t("networth.householdFigure", { value: money(household) }) : null,
    assets: money(view.current.totalAssets),
    liabilities: money(view.current.totalLiabilities),
    liquidLine: t("networth.liquidLine", { liquid: money(view.current.liquidAssets), illiquid: money(view.current.illiquidAssets) }),
    composition: view.current.composition.filter((share) => share.amount !== 0 || ALWAYS_SHOWN.includes(share.assetClass)).map((share) => ({
      key: share.assetClass,
      label: t(`networth.classes.${share.assetClass}`),
      percent: share.percent,
      amount: money(share.amount),
    })),
    ratesNote: base === "USD"
      ? t("networth.goldFrom", { gold: String(view.rateSet.xauSource) })
      : t("networth.ratesInUse", { rate: money(dollarRateMinor(view.rateSet, base)), kind: rateKind, gold: String(view.rateSet.xauSource) }),
    attribution: attribution ? {
      title: t("networth.attributionTitle", { month: formatMonthKey(attribution.since, i18n.language) }),
      rows: ATTRIBUTION_KEYS.map((key) => ({ key, label: t(`networth.attribution.${key}`), value: signed(attribution[key]), negative: attribution[key] < 0, total: key === "total" })),
    } : null,
    trend: {
      labels: [...closedTrend.map((p) => formatMonthKey(p.monthKey, i18n.language)), t("networth.now")],
      values: [...closedTrend.map((p) => p.netWorth), view.current.netWorth],
    },
    months: Array.from({ length: MONTHS_LISTED }, (_, i) => shiftKey(thisMonth, -i)).map((key) => {
      const closed = isMonthClosed(key, view.closes)
      const snapshot = closed ? snapshotFor(key, view.closes, view.snapshots) : undefined
      return {
        key, closed,
        label: formatMonthKey(key, i18n.language),
        snapshot: snapshot
          ? dollarRateOf(snapshot.rateSet) > 0 && base !== "USD"
            ? t("networth.snapshotLine", { value: money(snapshot.netWorth), at: when(snapshot.takenAt), rate: money(dollarRateMinor(snapshot.rateSet, base)) })
            : t("networth.snapshotLineNoRate", { value: money(snapshot.netWorth), at: when(snapshot.takenAt) })
          : null,
        busy: busy === key,
        disabled: offline || busy !== null,
        toggle: () => void act(key, closed ? "reopen" : "close"),
      }
    }),
  }
}

export type NetWorthScreenModel = ReturnType<typeof useNetWorthScreen>
