import { useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { rememberFromServer, useSession } from "@/api/auth"
import { describeError } from "@/app/errors"
import { Field } from "@/components/Field"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { CountrySelect } from "@/features/currency/CountrySelect"
import { CurrencySelect } from "@/features/currency/CurrencySelect"
import { useCatalogue } from "@/features/currency/useCurrencies"
import { useMetals } from "@/features/metals/useMetals"
import { updateProfile } from "@mizan/core/auth/profile"
import { changeBaseCurrency } from "@mizan/core/db/rebase"
import { unitRate } from "@mizan/core/market/currency"
import { IRAQ } from "@mizan/core/market/currency"
import { syncNow } from "@mizan/core/sync/engine"

/** ADR currency-1: where the person lives, and the household's currency (the owner changes it for everyone). */
export function CurrencyCard() {
  const { t } = useTranslation()
  const session = useSession()
  const catalogue = useCatalogue()
  const { prices } = useMetals()
  const base = session?.baseCurrency ?? "IQD"
  const [next, setNext] = useState(base)
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const owner = session?.role === "OWNER"
  const factor = unitRate(base, next, prices.perUsd)

  async function changeCountry(country: string) {
    try {
      await updateProfile({ country })
    } catch (e) {
      toast.error(describeError(e))
    }
  }

  async function change() {
    if (!session || factor === null) return
    setBusy(true)
    try {
      // Anything still waiting on this device goes up first, so it is converted with the rest.
      await syncNow()
      await changeBaseCurrency(session, next, factor)
      await rememberFromServer(null)
      void syncNow()
      setConfirming(false)
      toast.success(t("currency.changed", { currency: next }))
    } catch (e) {
      toast.error(describeError(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("currency.title")}</CardTitle>
        <CardDescription>{t("currency.body")}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <Field id="settings-country" label={t("auth.country")}>
          <CountrySelect id="settings-country" value={session?.country ?? IRAQ} catalogue={catalogue} onChange={(c) => void changeCountry(c)} />
        </Field>
        <Field id="settings-currency" label={t("auth.baseCurrency")} hint={owner ? t("currency.ownerHint") : t("currency.notOwner")}>
          {owner ? (
            <div className="flex gap-2">
              <CurrencySelect id="settings-currency" value={next} onChange={setNext} codes={catalogue?.currencies} />
              <Button type="button" variant="outline" disabled={next === base} onClick={() => setConfirming(true)}>{t("currency.change")}</Button>
            </div>
          ) : (
            <p className="py-2 font-medium">{base}</p>
          )}
        </Field>
      </CardContent>

      <Dialog open={confirming} onOpenChange={(open) => !busy && setConfirming(open)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("currency.confirmTitle", { from: base, to: next })}</DialogTitle>
            <DialogDescription>
              {factor === null ? t("currency.noRate", { from: base, to: next }) : t("currency.confirmBody", { from: base, to: next, rate: Number(factor.toPrecision(6)) })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" disabled={busy} onClick={() => setConfirming(false)}>{t("common.cancel")}</Button>
            <Button disabled={busy || factor === null} onClick={() => void change()}>{busy ? t("common.loading") : t("currency.change")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
