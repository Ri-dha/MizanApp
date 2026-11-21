import { ALL_TABLES, rows, rowsBy, sorted, store, table } from "../store/store"
import { type ExpenseOccurrence, type RecurringExpense, type Visibility } from "../schema"
import { softDelete, writeFields } from "./write"
import { toBaseAmount } from "./income"
import { createTransaction, deleteTransaction } from "./transactions"
import { monthWindow } from "../domain/calendar/month"
import { dueDates } from "../domain/expense/schedule"

export interface RecurringExpenseInput {
  name: string
  bucketId: string | null
  amount: number
  isEstimate: boolean
  currency: string
  fxRateMicros: number
  frequency: RecurringExpense["frequency"]
  dueDay: number | null
  anchorDate: string | null
  intervalDays: number | null
  activeFrom: string
  activeTo: string | null
  category: string | null
  note: string | null
  reminderDays: number | null
  visibility: Visibility
}

export async function createRecurringExpense(input: RecurringExpenseInput): Promise<string> {
  const id = crypto.randomUUID()
  const sortOrder = await table("recurringExpenses").count()
  await writeFields<RecurringExpense>("recurring_expense", id, { ...input, sortOrder })
  return id
}

export async function updateRecurringExpense(id: string, input: Partial<RecurringExpenseInput>) {
  await writeFields<RecurringExpense>("recurring_expense", id, input)
}

export function liveRecurringExpenses() {
  return sorted(rows("recurringExpenses", (e) => e.deletedAt === null), "sortOrder")
}

export function liveOccurrencesFor(monthKey: string) {
  return rowsBy("expenseOccurrences", "monthKey", monthKey, (o) => o.deletedAt === null)
}

export interface BillDue {
  expense: RecurringExpense
  dueDate: string
  expectedAmount: number
  occurrence: ExpenseOccurrence | undefined
}

/** Every due date in the month with its settlement, if any (FR-EXP-03). */
export function billsDue(expenses: RecurringExpense[], occurrences: ExpenseOccurrence[], monthKey: string, startDay: number): BillDue[] {
  const window = monthWindow(monthKey, startDay)
  const bills: BillDue[] = []
  for (const expense of expenses) {
    for (const dueDate of dueDates(expense, window)) {
      bills.push({
        expense,
        dueDate,
        expectedAmount: toBaseAmount(expense.amount, expense.fxRateMicros),
        occurrence: occurrences.find((o) => o.recurringExpenseId === expense.id && o.dueDate === dueDate),
      })
    }
  }
  return bills.sort((a, b) => (a.dueDate < b.dueDate ? -1 : a.dueDate > b.dueDate ? 1 : 0))
}

/** BR-03: paying records the transaction and settles the obligation in one step. */
export async function markBillPaid(bill: BillDue, monthKey: string, actualAmount: number, paidOn: string, cashAccountId: string | null = null): Promise<void> {
  await store().transaction(ALL_TABLES, async () => {
    const transactionId = await createTransaction({
      type: "EXPENSE",
      occurredOn: paidOn,
      monthKey,
      amount: actualAmount,
      currency: bill.expense.currency,
      fxRateMicros: bill.expense.fxRateMicros,
      bucketId: bill.expense.bucketId,
      category: bill.expense.category,
      payee: bill.expense.name,
      note: null,
      counterpartyType: null,
      counterpartyId: null,
      attachmentId: null,
      visibility: bill.expense.visibility,
      cashAccountId,
    })
    await writeFields<ExpenseOccurrence>("expense_occurrence", crypto.randomUUID(), {
      visibility: bill.expense.visibility,
      recurringExpenseId: bill.expense.id,
      dueDate: bill.dueDate,
      monthKey,
      expectedAmount: bill.expectedAmount,
      actualAmount: toBaseAmount(actualAmount, bill.expense.fxRateMicros),
      paidOn,
      transactionId,
    })
  })
}

export async function undoBillPaid(occurrence: ExpenseOccurrence): Promise<void> {
  await store().transaction(ALL_TABLES, async () => {
    if (occurrence.transactionId) await deleteTransaction(occurrence.transactionId)
    await softDelete("expense_occurrence", occurrence.id)
  })
}

/** Unpaid bills commit their expected amount to their bucket from the 1st (FR-EXP-04). */
export function committedByBills(bills: BillDue[]): Record<string, number> {
  const committed: Record<string, number> = {}
  for (const bill of bills) {
    if (bill.occurrence || !bill.expense.bucketId) continue
    committed[bill.expense.bucketId] = (committed[bill.expense.bucketId] ?? 0) + bill.expectedAmount
  }
  return committed
}
