import { fromMinorUnits, toMinorUnits } from "../domain/money/format"
import type { AccountShare, CashAccount } from "../schema"
import { unassigned } from "./cashMovements"

/** A picker needs a value for "no account" (ADR cash-1). */
export const NO_ACCOUNT = "none"

/** The picked account's id, or null for "No account" or an account that no longer exists. */
export const pickedAccount = (value: string, accounts: CashAccount[]): string | null => (accounts.some((a) => a.id === value) ? value : null)

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

/** Rows as the editor adds them: the first takes everything, later ones a fixed amount still to type. */
export function nextShareRow(rows: ShareRow[], accounts: CashAccount[]): ShareRow | null {
  const free = accounts.find((a) => !rows.some((r) => r.cashAccountId === a.id)) ?? accounts[0]
  if (!free) return null
  return rows.length === 0 ? { cashAccountId: free.id, kind: "PERCENT", text: "100" } : { cashAccountId: free.id, kind: "AMOUNT", text: "" }
}
