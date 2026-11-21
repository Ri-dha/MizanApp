import { ALL_TABLES, rows, sorted, store, table } from "../store/store"
import { type Goal, type GoalDeposit, type Visibility } from "../schema"
import { softDelete, writeFields } from "./write"
import { toBaseAmount } from "./income"
import { createTransaction, deleteTransaction } from "./transactions"
import { todayIso } from "../domain/calendar/month"

export interface GoalInput {
  name: string
  targetAmount: number
  currency: string
  /** Already saved before the goal existed: no transaction, no plan bucket touched. */
  openingAmount?: number
  targetDate: string | null
  monthlyContribution: number | null
  bucketId: string | null
  backingAssetId: string | null
  note: string | null
  visibility: Visibility
}

export async function createGoal(input: GoalInput): Promise<string> {
  const id = crypto.randomUUID()
  const sortOrder = await table("goals").count()
  await store().transaction(ALL_TABLES, async () => {
    await writeFields<Goal>("goal", id, { ...input, backingAssetType: input.backingAssetId ? "ASSET" : null, status: "ACTIVE", completedOn: null, sortOrder })
    await settleStatus(id)
  })
  return id
}

export async function updateGoal(id: string, input: Partial<GoalInput>) {
  const backing = input.backingAssetId === undefined ? {} : { backingAssetType: input.backingAssetId ? "ASSET" : null }
  await store().transaction(ALL_TABLES, async () => {
    await writeFields<Goal>("goal", id, { ...input, ...backing })
    await settleStatus(id)
  })
}

/** An already-saved amount or a lower target can reach a goal, or un-reach it, without a deposit. */
async function settleStatus(id: string) {
  const goal = await table("goals").get(id)
  if (!goal || goal.backingAssetId) return
  const reached = savedOf(goal, await liveDeposits()) >= goal.targetAmount
  if (reached && goal.status === "ACTIVE") await writeFields<Goal>("goal", id, { status: "COMPLETED", completedOn: todayIso() })
  else if (!reached && goal.status === "COMPLETED") await writeFields<Goal>("goal", id, { status: "ACTIVE", completedOn: null })
}

export function liveGoals() {
  return sorted(rows("goals", (g) => g.deletedAt === null), "sortOrder")
}

export function liveDeposits() {
  return sorted(rows("goalDeposits", (d) => d.deletedAt === null), "depositedOn")
}

/** FR-GOL-02 / BR-07: progress is what was already saved plus the deposit ledger, or the backing asset's value when one is set. */
export function savedOf(goal: Goal, deposits: GoalDeposit[], assetValues: Record<string, number> = {}): number {
  if (goal.backingAssetId && goal.backingAssetId in assetValues) return assetValues[goal.backingAssetId]
  return deposits
    .filter((d) => d.goalId === goal.id)
    .reduce((sum, d) => sum + (d.direction === "DEPOSIT" ? d.amount : -d.amount), goal.openingAmount ?? 0)
}

export async function recordDeposit(goal: Goal, deposits: GoalDeposit[], amount: number, direction: GoalDeposit["direction"], on: string, monthKey: string, note: string | null) {
  await store().transaction(ALL_TABLES, async () => {
    const transactionId = await createTransaction({
      type: "TRANSFER",
      occurredOn: on,
      monthKey,
      amount,
      currency: goal.currency,
      fxRateMicros: 1_000_000,
      bucketId: direction === "DEPOSIT" ? goal.bucketId : null,
      category: null,
      payee: goal.name,
      note,
      counterpartyType: direction === "DEPOSIT" ? "GOAL" : goal.bucketId ? "BUCKET" : null,
      counterpartyId: direction === "DEPOSIT" ? goal.id : goal.bucketId,
      attachmentId: null,
      visibility: goal.visibility,
    })
    await writeFields<GoalDeposit>("goal_deposit", crypto.randomUUID(), {
      visibility: goal.visibility, goalId: goal.id, depositedOn: on, monthKey, amount, direction, transactionId, note,
    })
    const saved = savedOf(goal, deposits) + (direction === "DEPOSIT" ? amount : -amount)
    if (saved >= goal.targetAmount && goal.status === "ACTIVE") {
      await writeFields<Goal>("goal", goal.id, { status: "COMPLETED", completedOn: on })
    } else if (saved < goal.targetAmount && goal.status === "COMPLETED") {
      await writeFields<Goal>("goal", goal.id, { status: "ACTIVE", completedOn: null })
    }
  })
}

export async function undoDeposit(deposit: GoalDeposit) {
  await store().transaction(ALL_TABLES, async () => {
    if (deposit.transactionId) await deleteTransaction(deposit.transactionId)
    await softDelete("goal_deposit", deposit.id)
  })
}

/** A planned monthly deposit commits its bucket until the month's deposit is made (BR-03). */
export function committedByGoals(goals: Goal[], deposits: GoalDeposit[], monthKey: string): Record<string, number> {
  const committed: Record<string, number> = {}
  for (const goal of goals) {
    if (goal.status !== "ACTIVE" || !goal.bucketId || !goal.monthlyContribution) continue
    if (deposits.some((d) => d.goalId === goal.id && d.monthKey === monthKey && d.direction === "DEPOSIT")) continue
    committed[goal.bucketId] = (committed[goal.bucketId] ?? 0) + toBaseAmount(goal.monthlyContribution, 1_000_000)
  }
  return committed
}
