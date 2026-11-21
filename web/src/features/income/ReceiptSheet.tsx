import { useEffect, useState, type FormEvent } from "react"
import { useTranslation } from "react-i18next"

import { useSession } from "@/api/auth"
import { Field } from "@/components/Field"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { microsToRate, RATE_SCALE, rateToMicros, recordReceipt, toBaseAmount } from "@mizan/core/db/income"
import type { IncomeReceipt } from "@/db/schema"
import { softDelete, writeFields } from "@mizan/core/db/write"
import { formatMoney, fromMinorUnits, toMinorUnits } from "@/app/money"
import { CurrencySelect } from "@/features/currency/CurrencySelect"
import { useTodayRate } from "@/features/currency/useCurrencies"
import { AccountSharesEditor } from "@/features/accounts/AccountSharesEditor"
import { overAssigned, rowsFrom, sharesFrom, type ShareRow } from "@/features/accounts/shareRows"
import { useAccountsNow } from "@/features/accounts/useAccountsNow"
import type { AccountShare } from "@mizan/core/schema"


export interface ReceiptDraft {
  existing: IncomeReceipt | null
  incomeSourceId: string | null
  monthKey: string
  receivedOn: string
  amount: number
  currency: string
  fxRateMicros: number
  /** The income source's usual split, or the receipt's own when editing. */
  intoAccounts?: AccountShare[]
}

export function ReceiptSheet({ draft, onClose }: { draft: ReceiptDraft | null; onClose: () => void }) {
  const { t, i18n } = useTranslation()
  const session = useSession()
  const base = session?.baseCurrency ?? "IQD"
  const [amount, setAmount] = useState("0")
  const [currency, setCurrency] = useState(base)
  const [rate, setRate] = useState("1")
  const todayRate = useTodayRate(base)
  const pickCurrency = (code: string) => {
    setCurrency(code)
    setRate(todayRate(code))
  }
  const [receivedOn, setReceivedOn] = useState("")
  const [note, setNote] = useState("")
  const [shares, setShares] = useState<ShareRow[]>([])
  const accounts = useAccountsNow()

  useEffect(() => {
    if (!draft) return
    setAmount(fromMinorUnits(draft.amount, draft.currency))
    setCurrency(draft.currency)
    setRate(microsToRate(draft.fxRateMicros, draft.currency, base))
    setReceivedOn(draft.receivedOn)
    setNote(draft.existing?.note ?? "")
    setShares(rowsFrom(draft.intoAccounts, draft.currency))
  }, [draft])

  const needsRate = currency !== base
  const fxRateMicros = needsRate ? rateToMicros(rate, currency, base) : RATE_SCALE
  const minor = toMinorUnits(amount, currency)

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!draft || overAssigned(shares, minor, currency)) return
    const intoAccounts = sharesFrom(shares, currency)
    const unchanged = JSON.stringify(intoAccounts) === JSON.stringify(draft.existing?.intoAccounts ?? [])
    // Rewriting an unchanged split would count it again after a balance the person set by hand (ADR cash-1).
    const fields = { receivedOn, amount: minor, currency, fxRateMicros, note: note.trim() || null, ...(draft.existing && unchanged ? {} : { intoAccounts }) }
    if (draft.existing) {
      await writeFields<IncomeReceipt>("income_receipt", draft.existing.id, { ...fields, baseAmount: toBaseAmount(minor, fxRateMicros) })
    } else {
      await recordReceipt({ ...fields, incomeSourceId: draft.incomeSourceId, monthKey: draft.monthKey, visibility: "SHARED" })
    }
    onClose()
  }

  async function remove() {
    if (draft?.existing) await softDelete("income_receipt", draft.existing.id)
    onClose()
  }

  return (
    <Sheet open={draft !== null} onOpenChange={(next) => !next && onClose()}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{draft?.incomeSourceId ? t("income.markReceived") : t("income.addIrregular")}</SheetTitle>
        </SheetHeader>
        <form onSubmit={submit} className="flex flex-col gap-4 px-4">
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <Field id="amount" label={t("income.amount")}>
              <Input id="amount" inputMode="decimal" dir="ltr" value={amount} onChange={(e) => setAmount(e.target.value)} required />
            </Field>
            <Field id="currency" label={t("accounts.currency")}>
              <CurrencySelect id="currency" value={currency} onChange={pickCurrency} className="w-24" />
            </Field>
          </div>
          {needsRate && (
            <Field id="rate" label={t("income.fxRate", { from: currency, to: base })} hint={`= ${formatMoney(toBaseAmount(minor, fxRateMicros), base, i18n.language)}`}>
              <Input id="rate" inputMode="decimal" dir="ltr" value={rate} onChange={(e) => setRate(e.target.value)} required />
            </Field>
          )}
          <Field id="receivedOn" label={t("income.receivedOnLabel")}>
            <Input id="receivedOn" type="date" dir="ltr" value={receivedOn} onChange={(e) => setReceivedOn(e.target.value)} required />
          </Field>
          <AccountSharesEditor rows={shares} onChange={setShares} accounts={accounts} amount={minor} currency={currency}
            label={t("cashMovements.intoAccounts")} hint={t("cashMovements.intoAccountsHint")} />
          <Field id="note" label={t("income.note")}>
            <Input id="note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={120} />
          </Field>
          <SheetFooter className="flex-row justify-between px-0">
            {draft?.existing && <Button type="button" variant="outline" onClick={() => void remove()}>{t("accounts.delete")}</Button>}
            <Button type="submit" disabled={overAssigned(shares, minor, currency)}>{t("accounts.save")}</Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
