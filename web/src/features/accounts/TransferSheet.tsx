import { useEffect, useState, type FormEvent } from "react"
import { useTranslation } from "react-i18next"

import { useSession } from "@/api/auth"
import { formatMoney, fromMinorUnits, toMinorUnits } from "@/app/money"
import { Field } from "@/components/Field"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { useMetals } from "@/features/metals/useMetals"
import { createAccountTransfer, updateAccountTransfer } from "@mizan/core/db/cashMovements"
import { deleteTransaction } from "@mizan/core/db/transactions"
import { monthKeyFor, todayIso } from "@mizan/core/domain/calendar/month"
import { inBase, marketFxRateMicros } from "@mizan/core/market/currency"
import type { CashAccount, LedgerTransaction } from "@mizan/core/schema"
import { useAccountsNow } from "./useAccountsNow"

/**
 * T-cash-movements: money moved between two of the person's own accounts. Between currencies the
 * amount received is asked for, since an exchange office's rate is not the market's.
 */
export function TransferSheet({ open, transfer, onClose }: { open: boolean; transfer: LedgerTransaction | null; onClose: () => void }) {
  const { t, i18n } = useTranslation()
  const session = useSession()
  const base = session?.baseCurrency ?? "IQD"
  const startDay = session?.monthStartDay ?? 1
  const accounts = useAccountsNow()
  const { prices } = useMetals()
  const [fromId, setFromId] = useState("")
  const [toId, setToId] = useState("")
  const [amount, setAmount] = useState("")
  const [received, setReceived] = useState("")
  const [receivedTyped, setReceivedTyped] = useState(false)
  const [occurredOn, setOccurredOn] = useState(todayIso())
  const [note, setNote] = useState("")

  useEffect(() => {
    if (!open) return
    setFromId(transfer?.cashAccountId ?? accounts[0]?.id ?? "")
    setToId(transfer?.counterpartyId ?? accounts[1]?.id ?? "")
    setAmount(transfer ? fromMinorUnits(transfer.amount, transfer.currency) : "")
    setReceivedTyped(!!transfer?.counterAmount)
    setOccurredOn(transfer?.occurredOn ?? todayIso())
    setNote(transfer?.note ?? "")
    // Accounts arrive after the sheet opens; the choice is made once per opening.
  }, [open, transfer])

  const from = accounts.find((a) => a.id === fromId)
  const to = accounts.find((a) => a.id === toId)
  const exchange = !!from && !!to && from.currency !== to.currency
  const sent = from ? toMinorUnits(amount || "0", from.currency) : 0
  const atToday = from && to ? inBase(sent, from.currency, to.currency, prices.perUsd) : null

  useEffect(() => {
    if (!open || !to) return
    if (transfer?.counterAmount && !receivedTyped) setReceived(fromMinorUnits(transfer.counterAmount, to.currency))
    else if (!receivedTyped) setReceived(atToday === null ? "" : fromMinorUnits(atToday, to.currency))
  }, [open, to, atToday, receivedTyped, transfer])

  const valid = !!from && !!to && from.id !== to.id && sent > 0 && (!exchange || toMinorUnits(received || "0", to.currency) > 0)

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!valid || !from || !to) return
    const input = {
      from: from as CashAccount, to: to as CashAccount, amount: sent,
      counterAmount: exchange ? toMinorUnits(received, to.currency) : sent,
      occurredOn, monthKey: monthKeyFor(occurredOn, startDay),
      fxRateMicros: marketFxRateMicros(from.currency, base, prices.perUsd) || 1_000_000,
      note: note.trim() || null,
    }
    if (transfer) await updateAccountTransfer(transfer, input)
    else await createAccountTransfer(input)
    onClose()
  }

  async function remove() {
    if (transfer) await deleteTransaction(transfer.id)
    onClose()
  }

  const accountItems = (except: string) => accounts.filter((a) => a.id !== except).map((a) => (
    <SelectItem key={a.id} value={a.id}>{a.name} · {formatMoney(a.balance, a.currency, i18n.language)}</SelectItem>
  ))

  return (
    <Sheet open={open} onOpenChange={(next) => !next && onClose()}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader><SheetTitle>{transfer ? t("cashMovements.editTransfer") : t("cashMovements.transfer")}</SheetTitle></SheetHeader>
        {accounts.length < 2 ? (
          <p className="px-4 text-sm opacity-70">{t("cashMovements.needTwoAccounts")}</p>
        ) : (
          <form onSubmit={submit} className="flex flex-col gap-4 px-4">
            <Field id="transferFrom" label={t("cashMovements.from")}>
              <Select value={fromId} onValueChange={setFromId}>
                <SelectTrigger id="transferFrom"><SelectValue /></SelectTrigger>
                <SelectContent>{accountItems(toId)}</SelectContent>
              </Select>
            </Field>
            <Field id="transferTo" label={t("cashMovements.to")}>
              <Select value={toId} onValueChange={setToId}>
                <SelectTrigger id="transferTo"><SelectValue /></SelectTrigger>
                <SelectContent>{accountItems(fromId)}</SelectContent>
              </Select>
            </Field>
            <Field id="transferAmount" label={t("cashMovements.amountSent", { currency: from?.currency ?? "" })}>
              <Input id="transferAmount" inputMode="decimal" dir="ltr" value={amount} onChange={(e) => setAmount(e.target.value)} required />
            </Field>
            {exchange && (
              <Field id="transferReceived" label={t("cashMovements.amountReceived", { currency: to?.currency ?? "" })} hint={t("cashMovements.receivedHint")}>
                <Input id="transferReceived" inputMode="decimal" dir="ltr" value={received}
                  onChange={(e) => { setReceivedTyped(true); setReceived(e.target.value) }} required />
              </Field>
            )}
            <Field id="transferOn" label={t("transactions.date")}>
              <Input id="transferOn" type="date" dir="ltr" value={occurredOn} onChange={(e) => setOccurredOn(e.target.value)} required />
            </Field>
            <Field id="transferNote" label={t("income.note")}>
              <Input id="transferNote" value={note} onChange={(e) => setNote(e.target.value)} maxLength={120} />
            </Field>
            <p className="text-xs opacity-70">{t("cashMovements.transferHint")}</p>
            <SheetFooter className="flex-row justify-between px-0">
              {transfer && <Button type="button" variant="outline" onClick={() => void remove()}>{t("accounts.delete")}</Button>}
              <Button type="submit" disabled={!valid}>{t("accounts.save")}</Button>
            </SheetFooter>
          </form>
        )}
      </SheetContent>
    </Sheet>
  )
}
