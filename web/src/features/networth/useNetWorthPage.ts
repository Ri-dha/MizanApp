import { useState } from "react"
import { useLiveQuery } from "dexie-react-hooks"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { useSession } from "@/api/auth"
import { formatWhen } from "@/app/dates"
import { describeError } from "@/app/errors"
import { formatMoney } from "@/app/money"
import { currentMonthKey, formatMonthKey, shiftMonth } from "@/app/month"
import { usePreferences } from "@/app/preferences"
import { useMetals } from "@/features/metals/useMetals"
import { syncNow } from "@/sync/engine"
import { useScreenTour } from "@/tours/useTour"
import { closeMonth, householdFigure, reopenMonth } from "@mizan/core/db/householdFigure"
import { isMonthClosed, snapshotFor, trendPoints } from "@mizan/core/db/networth"
import { attributionSinceLastClose, dollarRateMinor, dollarRateOf, inDollarCents } from "@mizan/core/db/netWorthView"
import { useNetWorth } from "./useNetWorth"

const MONTHS_LISTED = 12
const ALWAYS_SHOWN = ["CASH", "METALS", "RECEIVABLES"]

export const ATTRIBUTION_KEYS = ["total", "saving", "priceMovement", "debtRepayment", "newPurchases"] as const

export function useNetWorthPage() {
  const { t, i18n } = useTranslation()
  const session = useSession()
  const base = session?.baseCurrency ?? "IQD"
  const startDay = session?.monthStartDay ?? 1
  const view = useNetWorth()
  const [busy, setBusy] = useState<string | null>(null)
  const household = useLiveQuery(async () => (session ? { netWorth: (await householdFigure(session)).result.netWorth } : null), [session, view.current.netWorth], null)
  const prefs = usePreferences()
  useScreenTour("networth")
  const metals = useMetals()
  const attribution = attributionSinceLastClose(view, metals)
  const money = (v: number) => formatMoney(v, base, i18n.language)
  const dinar = base === "IQD"
  const rateKind = dinar ? t(`metals.rateKinds.${String(view.rateSet.rateKind)}`) : t("networth.worldRate")
  const inUsd = inDollarCents(view.current.netWorth, base, view.rateSet)
  const ratesNote = base === "USD"
    ? t("networth.goldFrom", { gold: String(view.rateSet.xauSource) })
    : t("networth.ratesInUse", { rate: money(dollarRateMinor(view.rateSet, base)), kind: rateKind, gold: String(view.rateSet.xauSource) })

  const thisMonth = currentMonthKey(startDay)
  const months = Array.from({ length: MONTHS_LISTED }, (_, i) => shiftMonth(thisMonth, -i)).map((key) => {
    const closed = isMonthClosed(key, view.closes)
    const snapshot = snapshotFor(key, view.closes, view.snapshots)
    const at = snapshot ? formatWhen(snapshot.takenAt, i18n.language) : ""
    return {
      key,
      label: formatMonthKey(key, i18n.language),
      closed,
      snapshotLine: snapshot && closed
        ? dollarRateOf(snapshot.rateSet) > 0 && base !== "USD"
          ? t("networth.snapshotLine", { value: money(snapshot.netWorth), at, rate: money(dollarRateMinor(snapshot.rateSet, base)) })
          : t("networth.snapshotLineNoRate", { value: money(snapshot.netWorth), at })
        : null,
    }
  })
  const trend = [
    ...trendPoints(view.closes, view.snapshots).map((s) => ({ key: s.monthKey, label: formatMonthKey(s.monthKey, i18n.language), value: s.netWorth })),
    { key: "now", label: t("networth.now"), value: view.current.netWorth },
  ]

  async function act(monthKey: string, action: "close" | "reopen") {
    setBusy(monthKey)
    try {
      if (!session) return
      if (action === "close") await closeMonth(session, monthKey)
      else await reopenMonth(monthKey)
      void syncNow()
      toast(t(action === "close" ? "networth.closed" : "networth.reopened", { month: formatMonthKey(monthKey, i18n.language) }))
    } catch (e) {
      toast(describeError(e))
    } finally {
      setBusy(null)
    }
  }

  return {
    view,
    money,
    language: i18n.language,
    dinar,
    rateKind,
    ratesNote,
    usd: prefs.showUsd && inUsd !== null ? formatMoney(inUsd, "USD", i18n.language) : null,
    householdNetWorth: household && household.netWorth !== view.current.netWorth ? household.netWorth : null,
    composition: view.current.composition.filter((share) => share.amount !== 0 || ALWAYS_SHOWN.includes(share.assetClass)),
    attribution,
    attributionMonth: attribution ? formatMonthKey(attribution.since, i18n.language) : "",
    trend,
    months,
    busy,
    online: navigator.onLine,
    act,
  }
}

export type NetWorthPageModel = ReturnType<typeof useNetWorthPage>
