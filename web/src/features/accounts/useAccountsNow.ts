import { useLiveQuery } from "dexie-react-hooks"

import { useMetals } from "@/features/metals/useMetals"
import { liveCashAccounts } from "@mizan/core/db/cashAccounts"
import { liveMovementSources, movementsOf, withMovements, type Movement } from "@mizan/core/db/cashMovements"
import type { CashAccount } from "@mizan/core/schema"

interface AccountsNow {
  accounts: CashAccount[]
  movements: Movement[]
}

const EMPTY: AccountsNow = { accounts: [], movements: [] }

/** Accounts with today's balances and the linked records behind them (ADR cash-1). */
export function useAccountsWithMovements(): AccountsNow {
  const { prices } = useMetals()
  return useLiveQuery(async () => {
    const [accounts, sources] = await Promise.all([liveCashAccounts(), liveMovementSources()])
    const movements = movementsOf(accounts, sources, prices.perUsd)
    return { accounts: withMovements(accounts, movements), movements }
  }, [prices.perUsd], EMPTY)
}

/** Accounts with today's balances: the balance last set, plus linked income and minus linked spending since. */
export function useAccountsNow(): CashAccount[] {
  return useAccountsWithMovements().accounts
}
