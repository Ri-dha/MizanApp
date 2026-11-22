import { Camera, X } from "lucide-react"
import { useRef } from "react"
import { useTranslation } from "react-i18next"

import { RECEIPT_RETENTION_DAYS } from "@/attachments/store"
import { Field } from "@/components/Field"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Switch } from "@/components/ui/switch"
import { NO_ACCOUNT } from "@/features/accounts/lastAccount"
import { CurrencySelect } from "@/features/currency/CurrencySelect"
import { cn } from "@/lib/utils"
import type { QuickAddModel } from "../useQuickAdd"

const NO_ASSET = "__none__"

/** Soft: the kind as a segmented switch, a large amount, buckets as pills, then the optional details. */
export default function QuickAddSoft({ model }: { model: QuickAddModel }) {
  const { t } = useTranslation()
  const { transaction, type, buckets, parts } = model
  const fileInput = useRef<HTMLInputElement>(null)

  return (
    <Sheet open={model.open} onOpenChange={(next) => !next && model.onClose()}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{transaction ? t("transactions.edit") : t("transactions.add")}</SheetTitle>
        </SheetHeader>
        <form onSubmit={model.submit} className="flex flex-col gap-4 px-4">
          <div role="group" className={cn("grid gap-0.5 rounded-lg bg-muted p-[3px]", model.types.length === 2 ? "grid-cols-2" : "grid-cols-3")}>
            {model.types.map((choice) => (
              <button key={choice} type="button" aria-pressed={type === choice} onClick={() => model.setType(choice)}
                className={cn("rounded-md px-3 py-1.5 text-sm text-muted-foreground", type === choice && "bg-card font-semibold text-foreground shadow-card")}>
                {t(`transactions.types.${choice}`)}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-[1fr_auto] gap-2">
            <Field id="amount" label={t("transactions.amount")}>
              <Input id="amount" inputMode="decimal" dir="ltr" autoFocus value={model.amount} onChange={(e) => model.setAmount(e.target.value)} required className="h-14 text-2xl font-semibold" />
            </Field>
            <Field id="currency" label={t("accounts.currency")}>
              <CurrencySelect id="currency" value={model.currency} onChange={model.pickCurrency} className="h-14 w-24" />
            </Field>
          </div>
          {model.needsRate && (
            <Field id="rate" label={t("income.fxRate", { from: model.currency, to: model.base })}>
              <Input id="rate" inputMode="decimal" dir="ltr" value={model.rate} onChange={(e) => model.setRate(e.target.value)} required />
            </Field>
          )}

          {model.canSplit && (
            <div className="flex items-center gap-2">
              <Switch id="split" checked={model.split} onCheckedChange={model.toggleSplit} />
              <Label htmlFor="split">{t("transactions.split")}</Label>
            </div>
          )}
          {model.splitting ? (
            <div className="flex flex-col gap-2">
              {parts.map((part, i) => (
                <div key={i} className="grid grid-cols-[1fr_7rem_auto] gap-2">
                  <Select value={part.bucketId} onValueChange={(v) => model.setPart(i, { bucketId: v })}>
                    <SelectTrigger><SelectValue placeholder={t("transactions.bucket")} /></SelectTrigger>
                    <SelectContent>{buckets.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
                  </Select>
                  <Input inputMode="decimal" dir="ltr" placeholder="0" value={part.amount} onChange={(e) => model.setPart(i, { amount: e.target.value })} />
                  <Button type="button" variant="ghost" size="icon" onClick={() => model.removePart(i)}><X /></Button>
                </div>
              ))}
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <Button type="button" variant="ghost" size="sm" className="text-link" onClick={model.addPart}>{t("transactions.addPart")}</Button>
                <span className={model.splitRemainder === 0 ? "text-muted-foreground" : "text-destructive"}>{t("transactions.splitRemainder", { amount: model.splitRemainderText })}</span>
              </div>
            </div>
          ) : type !== "INCOME" && !model.bucketless && (
            <div className="flex flex-col gap-1.5">
              <Label>{type === "TRANSFER" ? t("transactions.fromBucket") : t("transactions.bucket")}</Label>
              <div className="flex flex-wrap gap-2">
                {buckets.map((bucket) => (
                  <button key={bucket.id} type="button" aria-pressed={model.bucketId === bucket.id} onClick={() => model.setBucketId(bucket.id)}
                    className={cn("flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-sm font-medium", model.bucketId === bucket.id ? "border-transparent bg-accent font-semibold text-accent-foreground" : "bg-card")}>
                    <span className="size-2.5 rounded-full" style={{ background: bucket.colour }} />
                    {bucket.name}
                  </button>
                ))}
                {buckets.length === 0 && <span className="text-sm text-muted-foreground">{t("plan.noBuckets")}</span>}
              </div>
            </div>
          )}

          {(type === "EXPENSE" || type === "INCOME") && model.cashAccounts.length > 0 && (
            <Field id="cashAccount" label={type === "EXPENSE" ? t("cashMovements.paidFrom") : t("cashMovements.intoAccount")} hint={t("cashMovements.accountHint")}>
              <Select value={model.accountId} onValueChange={model.setAccountId}>
                <SelectTrigger id="cashAccount"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_ACCOUNT}>{t("cashMovements.noAccount")}</SelectItem>
                  {model.cashAccounts.map((c) => <SelectItem key={c.id} value={c.id}>{c.name} ({c.currency})</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
          )}

          {type === "TRANSFER" && (
            <Field id="counterparty" label={t("transactions.to")}>
              <Select value={model.counterparty} onValueChange={model.setCounterparty}>
                <SelectTrigger id="counterparty"><SelectValue placeholder={t("transactions.choose")} /></SelectTrigger>
                <SelectContent>
                  {buckets.filter((b) => b.id !== model.bucketId).map((b) => <SelectItem key={b.id} value={`BUCKET:${b.id}`}>{t("transactions.bucket")}: {b.name}</SelectItem>)}
                  {model.goals.map((g) => <SelectItem key={g.id} value={`GOAL:${g.id}`}>{t("nav.goals")}: {g.name}</SelectItem>)}
                  {model.debts.map((d) => <SelectItem key={d.id} value={`DEBT:${d.id}`}>{t("nav.debts")}: {d.name}</SelectItem>)}
                  {model.cashAccounts.map((c) => <SelectItem key={c.id} value={`CASH_ACCOUNT:${c.id}`}>{t("nav.accounts")}: {c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
          )}

          <Field id="occurredOn" label={t("transactions.date")}>
            <Input id="occurredOn" type="date" dir="ltr" value={model.occurredOn} onChange={(e) => model.setOccurredOn(e.target.value)} required />
          </Field>
          <Field id="payee" label={t("transactions.payee")}>
            <Input id="payee" value={model.payee} onChange={(e) => model.setPayee(e.target.value)} maxLength={80} />
          </Field>
          <Field id="category" label={t("transactions.category")} hint={model.categorySuggested ? t("transactions.suggested") : undefined}>
            <Input id="category" list="categories" value={model.category} onChange={(e) => model.setCategory(e.target.value)} maxLength={40} />
            <datalist id="categories">{model.categories.map((c) => <option key={c} value={c} />)}</datalist>
          </Field>
          <Field id="note" label={t("income.note")}>
            <Input id="note" value={model.note} onChange={(e) => model.setNote(e.target.value)} maxLength={200} />
          </Field>
          {model.heldAssets.length > 0 && (
            <Field id="asset" label={t("transactions.relatedAsset")} hint={t("transactions.relatedAssetHint")}>
              <Select value={model.assetId || NO_ASSET} onValueChange={(v) => model.setAssetId(v === NO_ASSET ? "" : v)}>
                <SelectTrigger id="asset"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_ASSET}>{t("bills.noBucket")}</SelectItem>
                  {model.heldAssets.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
          )}
          {transaction?.splitGroupId && <p className="text-xs text-muted-foreground">{t("transactions.partOfSplit")}</p>}

          <div className="flex flex-col gap-2">
            <Label>{t("transactions.receipt")}</Label>
            <p className="text-xs text-muted-foreground">{t("transactions.receiptKeptFor", { days: RECEIPT_RETENTION_DAYS })}</p>
            {model.photoRemoved && <p className="text-sm">{t("transactions.receiptRemoved", { days: RECEIPT_RETENTION_DAYS })}</p>}
            <input ref={fileInput} type="file" accept="image/*" capture="environment" hidden onChange={(e) => void model.pickPhoto(e.target.files?.[0])} />
            {model.preview ? (
              <div className="relative w-fit">
                <img src={model.preview} alt="" className="max-h-40 rounded-lg border border-border" />
                <Button type="button" variant="outline" size="sm" className="mt-2" disabled={model.reading} onClick={() => void model.readPhoto()}>{model.reading ? t("ocr.reading") : t("ocr.read_button")}</Button>
                <Button type="button" size="icon" variant="outline" className="absolute -end-2 -top-2 size-7" onClick={model.removePhoto}><X /></Button>
              </div>
            ) : (
              <Button type="button" variant="outline" className="w-fit" onClick={() => fileInput.current?.click()}>
                <Camera /> {t("transactions.addReceipt")}
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Switch id="private" checked={model.isPrivate} onCheckedChange={model.setIsPrivate} />
            <Label htmlFor="private">{t("accounts.private")}</Label>
          </div>

          <SheetFooter className="flex-row justify-between px-0">
            {transaction && <Button type="button" variant="ghost" className="text-destructive" onClick={() => void model.remove()}>{t("accounts.delete")}</Button>}
            <Button type="submit" disabled={!model.canSave}>{t("accounts.save")}</Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
