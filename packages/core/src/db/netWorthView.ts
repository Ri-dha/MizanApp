import { liveAssets, liveValuations } from "./assets"
import { liveCashAccounts } from "./cashAccounts"
import { liveDebts, livePayments } from "./debts"
import { toBaseAmount } from "./income"
import { liveMonthCloses, liveNetWorth, liveSnapshots, trendPoints } from "./networth"
import type { Asset, AssetValuation, MonthClose, NetWorthSnapshot } from "../schema"
import { todayIso } from "../domain/calendar/month"
import { attributeChange, type Attribution, type Reading } from "../domain/networth/attribution"
import type { NetWorthResult } from "../domain/networth/networth"
import type { ResolvedPrices } from "../market/prices"
import type { MetalsView } from "./metalsView"

export interface NetWorthView {
  current: NetWorthResult
  closes: MonthClose[]
  snapshots: NetWorthSnapshot[]
  assets: Asset[]
  valuations: AssetValuation[]
  rateSet: Record<string, unknown>
}

export type NetWorthFigures = Omit<NetWorthView, "rateSet">

const EMPTY_RESULT: NetWorthResult = { totalAssets: 0, totalLiabilities: 0, netWorth: 0, liquidAssets: 0, illiquidAssets: 0, composition: [] }

export const EMPTY_NET_WORTH: NetWorthFigures = { current: EMPTY_RESULT, closes: [], snapshots: [], assets: [], valuations: [] }

export function metalsValueOf(metals: MetalsView): number {
  return metals.lines.reduce((sum, line) => sum + line.valueNow, 0)
}

/** FR-NET-01: the live figure reconciles to its components by construction; snapshots come from the server. */
export async function netWorthFiguresFor(baseCurrency: string, prices: ResolvedPrices, metalsValue: number): Promise<NetWorthFigures> {
  const [accounts, debts, payments, closes, snapshots, assets, valuations] = await Promise.all([
    liveCashAccounts(), liveDebts(), livePayments(), liveMonthCloses(), liveSnapshots(), liveAssets(), liveValuations(),
  ])
  return { current: liveNetWorth(accounts, baseCurrency, prices, metalsValue, debts, payments, assets, valuations, todayIso()), closes, snapshots, assets, valuations }
}

export function rateSetOf(prices: ResolvedPrices): Record<string, unknown> {
  return {
    baseCurrency: prices.base,
    usdBaseMicros: prices.usdBaseMicros,
    rateKind: prices.rateKind,
    usdIqdMicros: prices.usdIqdMicros,
    usdIqdSource: prices.rateSource.label,
    xauSource: prices.spot.GOLD.source.label,
    xagSource: prices.spot.SILVER.source.label,
  }
}

const OTHER_ASSET_CLASSES = ["VEHICLES", "PROPERTY", "OTHER_ASSETS"]

function readingOf(composition: { assetClass: string; amount: number }[], liabilities: number): Reading {
  const amount = (cls: string) => composition.find((c) => c.assetClass === cls)?.amount ?? 0
  return {
    cash: amount("CASH"),
    metals: amount("METALS"),
    receivables: amount("RECEIVABLES"),
    otherAssets: OTHER_ASSET_CLASSES.reduce((sum, cls) => sum + amount(cls), 0),
    liabilities,
  }
}

/** FR-NET-05: why net worth moved since the last closed month, or null before any month is closed. */
export function attributionSinceLastClose(view: NetWorthFigures, metals: MetalsView): (Attribution & { since: string }) | null {
  const lastClosed = trendPoints(view.closes, view.snapshots).at(-1)
  if (!lastClosed) return null
  const from = lastClosed.takenAt.slice(0, 10)
  const before = readingOf(lastClosed.composition, lastClosed.totalLiabilities)
  const after = readingOf(view.current.composition, view.current.totalLiabilities)
  const lotCost = (lot: MetalsView["lots"][number]) => toBaseAmount(lot.metalCost + lot.makingCharge + lot.fees, lot.fxRateMicros)
  const purchases = metals.lots.filter((l) => l.purchaseDate > from).reduce((s, l) => s + lotCost(l), 0)
    + view.assets.filter((a) => a.purchaseDate !== null && a.purchaseDate > from).reduce((s, a) => s + toBaseAmount(a.purchasePrice, a.fxRateMicros), 0)
  const soldLots = new Set(metals.disposals.filter((d) => d.soldOn > from).map((d) => d.id))
  const disposals = metals.disposalLots.filter((dl) => soldLots.has(dl.disposalId)).reduce((s, dl) => s + dl.metalCost + dl.makingCharge + dl.fees, 0)
    + view.assets.filter((a) => a.status === "SOLD" && a.soldOn !== null && a.soldOn > from).reduce((s, a) => s + toBaseAmount(a.purchasePrice, a.fxRateMicros), 0)
  return { since: lastClosed.monthKey, ...attributeChange(before, after, { purchases, disposals }) }
}
