
import { balanceOf, committedByDebts, liveDebts, livePayments } from "./debts"
import { billsDue, committedByBills, liveOccurrencesFor, liveRecurringExpenses, type BillDue } from "./expenses"
import { committedByGoals, liveDeposits, liveGoals, savedOf } from "./goals"
import { liveAmountHistory, liveIncomeSources, liveReceiptsFor, monthIncome, occurrencesFor, type PlannedOccurrence } from "./income"
import { liveBucketsOf, liveMovesFor, livePlans, planFor } from "./plan"
import type { Bucket, BucketMove, Debt, DebtPayment, Goal, GoalDeposit, IncomeReceipt, IncomeSource, IncomeSourceAmount, LedgerTransaction, Plan, RecurringExpense } from "../schema"
import { liveTransactionsFor, spentByBucket, transfersByBucket } from "./transactions"
import { shiftKey } from "../domain/calendar/month"
import { monthFigures, type MonthFiguresResult } from "../domain/plan/figures"

export interface MonthView {
  plan: Plan | undefined
  buckets: Bucket[]
  sources: IncomeSource[]
  amountHistory: IncomeSourceAmount[]
  receipts: IncomeReceipt[]
  occurrences: PlannedOccurrence[]
  income: { planned: number; received: number }
  bills: BillDue[]
  transactions: LedgerTransaction[]
  debts: Debt[]
  debtPayments: DebtPayment[]
  goals: Goal[]
  goalDeposits: GoalDeposit[]
  moves: BucketMove[]
  figures: MonthFiguresResult
}

export const EMPTY_MONTH_VIEW: MonthView = {
  plan: undefined, buckets: [], sources: [], amountHistory: [], receipts: [], occurrences: [],
  income: { planned: 0, received: 0 }, bills: [], transactions: [], debts: [], debtPayments: [], goals: [], goalDeposits: [], moves: [],
  figures: { buckets: [], totalShareBasisPoints: 0, fixedTotal: 0, unallocatedPlanned: 0, unallocatedReceived: 0 },
}

/**
 * ADR mode-1: a month's money in and out however it was recorded, with no plan needed. Income
 * receipts and income transactions come in; every expense goes out, bucket or not.
 */
export function monthFlow(view: Pick<MonthView, "receipts" | "transactions">): { received: number; spent: number; left: number } {
  const received = view.receipts.reduce((sum, r) => sum + r.baseAmount, 0)
    + view.transactions.filter((t) => t.type === "INCOME").reduce((sum, t) => sum + t.baseAmount, 0)
  const spent = view.transactions.filter((t) => t.type === "EXPENSE").reduce((sum, t) => sum + t.baseAmount, 0)
  return { received, spent, left: received - spent }
}

/** FR-PLN-08: carry-over follows the chain back at most this far within one plan version. */
const CARRY_OVER_DEPTH = 12

function sumMaps(...maps: Record<string, number>[]): Record<string, number> {
  const total: Record<string, number> = {}
  for (const map of maps) for (const [key, value] of Object.entries(map)) total[key] = (total[key] ?? 0) + value
  return total
}

interface HouseholdData {
  sources: IncomeSource[]
  amountHistory: IncomeSourceAmount[]
  expenses: RecurringExpense[]
  debts: Debt[]
  debtPayments: DebtPayment[]
  goals: Goal[]
  goalDeposits: GoalDeposit[]
}

async function figuresFor(monthKey: string, startDay: number, buckets: Bucket[], data: HouseholdData, carriedIn: Record<string, number>) {
  const [receipts, paidOccurrences, transactions] = await Promise.all([liveReceiptsFor(monthKey), liveOccurrencesFor(monthKey), liveTransactionsFor(monthKey)])
  const occurrences = occurrencesFor(data.sources, receipts, monthKey, startDay, data.amountHistory)
  const income = monthIncome(occurrences, receipts)
  const bills = billsDue(data.expenses, paidOccurrences, monthKey, startDay)
  const { transfersIn, transfersOut } = transfersByBucket(transactions)
  const figures = monthFigures({
    plannedIncome: income.planned,
    receivedIncome: income.received,
    buckets: buckets.map((b) => ({ id: b.id, shareBasisPoints: b.shareBasisPoints, fixedAmount: b.fixedAmount })),
    carriedIn,
    committed: sumMaps(committedByBills(bills), committedByDebts(data.debts, data.debtPayments, monthKey), committedByGoals(data.goals, data.goalDeposits, monthKey)),
    spent: spentByBucket(transactions),
    transfersIn,
    transfersOut,
  })
  return { receipts, occurrences, income, bills, transactions, figures }
}

/** Last month's free, for buckets that carry over, computed forward from the start of the plan version (clamped at zero). */
async function carriedInFor(monthKey: string, startDay: number, plan: Plan, buckets: Bucket[], data: HouseholdData): Promise<Record<string, number>> {
  const carrying = buckets.filter((b) => b.carryOver)
  if (carrying.length === 0) return {}
  let cursor = plan.effectiveFrom
  const earliest = shiftKey(monthKey, -CARRY_OVER_DEPTH)
  if (cursor < earliest) cursor = earliest
  let carried: Record<string, number> = {}
  while (cursor < monthKey) {
    const { figures } = await figuresFor(cursor, startDay, buckets, data, carried)
    carried = Object.fromEntries(carrying.map((b) => [b.id, Math.max(0, figures.buckets.find((f) => f.id === b.id)?.free ?? 0)]))
    cursor = shiftKey(cursor, 1)
  }
  return carried
}

/** One month's full view, also used by reports that walk several months. */
export async function monthViewFor(monthKey: string, startDay: number): Promise<MonthView> {
    const [plans, sources, amountHistory, expenses, debts, debtPayments, goals, goalDeposits, moves] = await Promise.all([
      livePlans(), liveIncomeSources(), liveAmountHistory(), liveRecurringExpenses(), liveDebts(), livePayments(), liveGoals(), liveDeposits(), liveMovesFor(monthKey),
    ])
    const data: HouseholdData = { sources, amountHistory, expenses, debts, debtPayments, goals, goalDeposits }
    const plan = planFor(plans, monthKey)
    const buckets = await liveBucketsOf(plan?.id)
    const carriedIn = plan ? await carriedInFor(monthKey, startDay, plan, buckets, data) : {}
    const month = await figuresFor(monthKey, startDay, buckets, data, carriedIn)
    return { plan, buckets, sources, amountHistory, debts, debtPayments, goals, goalDeposits, moves, ...month }
}

/** Everything a month screen needs, recomputed whenever any underlying row changes. */

export { balanceOf, savedOf }
