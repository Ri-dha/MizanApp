import { router } from "expo-router"
import { useEffect, useMemo, useState } from "react"

import { createAccountTransfer, updateAccountTransfer } from "@mizan/core/db/cashMovements"
import { deleteTransaction } from "@mizan/core/db/transactions"
import { monthKeyFor, todayIso } from "@mizan/core/domain/calendar/month"
import { inBase, marketFxRateMicros } from "@mizan/core/market/currency"
import { table } from "@mizan/core/store/store"
import { useLiveQuery, useSession } from "@/hooks/use-core"
import { useCashAccounts, useMetals } from "@/hooks/use-views"
import { fromMinorUnits, toMinorUnits } from "@/utils/money"

const SAME_RATE = 1_000_000

/**
 * T-cash-movements: money moved between two of the person's own accounts. Between currencies the
 * amount received is asked for, since an exchange office's rate is not the market's.
 */
export function useAccountTransferScreen({ id }: { id?: string }) {
  const session = useSession()
  const base = session?.baseCurrency ?? "IQD"
  const startDay = session?.monthStartDay ?? 1
  const accounts = useCashAccounts()
  const { prices } = useMetals()
  const transfer = useLiveQuery(() => (id ? table("transactions").get(id) : Promise.resolve(undefined)), [id], undefined)
  const [fromId, setFromId] = useState("")
  const [toId, setToId] = useState("")
  const [amount, setAmount] = useState("")
  const [received, setReceived] = useState("")
  const [receivedTyped, setReceivedTyped] = useState(false)
  const [occurredOn, setOccurredOn] = useState(todayIso())
  const [note, setNote] = useState("")
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (loaded || (id && !transfer) || accounts.length === 0) return
    setFromId(transfer?.cashAccountId ?? accounts[0]?.id ?? "")
    setToId(transfer?.counterpartyId ?? accounts[1]?.id ?? "")
    setAmount(transfer ? fromMinorUnits(transfer.amount, transfer.currency) : "")
    const arrivedIn = accounts.find((a) => a.id === transfer?.counterpartyId)
    if (transfer?.counterAmount && arrivedIn) setReceived(fromMinorUnits(transfer.counterAmount, arrivedIn.currency))
    setReceivedTyped(!!transfer?.counterAmount)
    setOccurredOn(transfer?.occurredOn ?? todayIso())
    setNote(transfer?.note ?? "")
    setLoaded(true)
  }, [loaded, id, transfer, accounts])

  const from = accounts.find((a) => a.id === fromId)
  const to = accounts.find((a) => a.id === toId)
  const exchange = !!from && !!to && from.currency !== to.currency
  const sent = from ? toMinorUnits(amount || "0", from.currency) : 0
  const atToday = from && to ? inBase(sent, from.currency, to.currency, prices.perUsd) : null

  useEffect(() => {
    if (!to || receivedTyped) return
    setReceived(atToday === null ? "" : fromMinorUnits(atToday, to.currency))
  }, [to, atToday, receivedTyped])

  const fromChoices = useMemo(() => accounts.filter((a) => a.id !== toId), [accounts, toId])
  const toChoices = useMemo(() => accounts.filter((a) => a.id !== fromId), [accounts, fromId])
  const valid = !!from && !!to && from.id !== to.id && sent > 0 && (!exchange || toMinorUnits(received || "0", to.currency) > 0)

  async function save() {
    if (!valid || !from || !to) return
    const input = {
      from, to, amount: sent,
      counterAmount: exchange ? toMinorUnits(received, to.currency) : sent,
      occurredOn, monthKey: monthKeyFor(occurredOn, startDay),
      fxRateMicros: marketFxRateMicros(from.currency, base, prices.perUsd) || SAME_RATE,
      note: note.trim() || null,
    }
    if (transfer) await updateAccountTransfer(transfer, input)
    else await createAccountTransfer(input)
    router.back()
  }

  async function remove() {
    if (transfer) await deleteTransaction(transfer.id)
    router.back()
  }

  return { id, accounts, fromId, setFromId, toId, setToId, amount, setAmount, received, occurredOn, setOccurredOn, note, setNote, from, to, exchange, fromChoices, toChoices, valid, typeReceived: (value: string) => { setReceivedTyped(true); setReceived(value) }, save: () => void save(), remove: () => void remove() }
}

export type AccountTransferModel = ReturnType<typeof useAccountTransferScreen>
