import { liveAssets, liveValuations } from "./assets"
import { liveCashAccounts } from "./cashAccounts"
import { liveDebts, livePayments } from "./debts"
import { liveMonthCloses, liveNetWorth, liveSnapshots } from "./networth"
import type { Asset, AssetValuation, MonthClose, NetWorthSnapshot } from "../schema"
import { todayIso } from "../domain/calendar/month"
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
    rateKind: prices.rateKind,
    usdIqdMicros: prices.usdIqdMicros,
    usdIqdSource: prices.rateSource.label,
    xauSource: prices.spot.GOLD.source.label,
    xagSource: prices.spot.SILVER.source.label,
  }
}
