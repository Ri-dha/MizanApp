import { fromMinorUnits, toMinorUnits } from "@/app/money"
import { unassigned } from "@mizan/core/db/cashMovements"
import type { AccountShare } from "@mizan/core/schema"

const BASIS_POINTS_PER_PERCENT = 100

/** What the person is typing: kept as text so "12." survives until it is a number. */
export interface ShareRow {
  cashAccountId: string
  kind: AccountShare["kind"]
  text: string
}

export function rowsFrom(shares: AccountShare[] | undefined, currency: string): ShareRow[] {
  return (shares ?? []).map((s) => ({
    cashAccountId: s.cashAccountId,
    kind: s.kind,
    text: s.kind === "AMOUNT" ? fromMinorUnits(s.value, currency) : String(s.value / BASIS_POINTS_PER_PERCENT),
  }))
}

/** Rows without an account or an amount are left out. */
export function sharesFrom(rows: ShareRow[], currency: string): AccountShare[] {
  return rows
    .filter((r) => r.cashAccountId && r.text.trim() !== "")
    .map((r) => ({
      cashAccountId: r.cashAccountId,
      kind: r.kind,
      value: r.kind === "AMOUNT" ? toMinorUnits(r.text, currency) : Math.round(Number(r.text) * BASIS_POINTS_PER_PERCENT),
    }))
}

/** True when the shares ask for more than the amount; the form should not save then. */
export function overAssigned(rows: ShareRow[], amount: number, currency: string): boolean {
  return unassigned(amount, sharesFrom(rows, currency)) < 0
}
