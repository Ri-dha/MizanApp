import { useEffect, useState, type FormEvent } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { formatMoney, toMinorUnits } from "@/app/money"
import type { Bucket } from "@/db/schema"
import { moveMoney } from "@mizan/core/db/plan"
import { monthKeyFor, monthWindow, todayIso } from "@mizan/core/domain/calendar/month"
import type { MonthFiguresResult } from "@mizan/core/domain/plan/figures"

export interface MoveMoneyProps {
  open: boolean
  buckets: Bucket[]
  figures: MonthFiguresResult
  monthKey: string
  startDay: number
  currency: string
  onClose: () => void
}

export function useMoveMoney({ open, buckets, figures, monthKey, startDay, currency, onClose }: MoveMoneyProps) {
  const { t, i18n } = useTranslation()
  const [fromId, setFromId] = useState("")
  const [toId, setToId] = useState("")
  const [amount, setAmount] = useState("")
  const [reason, setReason] = useState("")
  const [on, setOn] = useState(todayIso())

  useEffect(() => {
    if (!open) return
    setFromId(buckets[0]?.id ?? "")
    setToId(buckets[1]?.id ?? "")
    setAmount("")
    setReason("")
    const today = todayIso()
    setOn(monthKeyFor(today, startDay) === monthKey ? today : monthWindow(monthKey, startDay).from)
  }, [open, buckets, monthKey, startDay])

  const money = (value: number) => formatMoney(value, currency, i18n.language)
  const freeOf = (id: string) => figures.buckets.find((b) => b.id === id)?.free ?? 0

  return {
    open,
    onClose,
    buckets,
    money,
    freeOf,
    from: buckets.find((b) => b.id === fromId),
    to: buckets.find((b) => b.id === toId),
    fromId,
    setFromId,
    toId,
    setToId,
    amount,
    setAmount,
    reason,
    setReason,
    on,
    setOn,
    canSubmit: Boolean(fromId) && Boolean(toId) && fromId !== toId,
    async submit(event: FormEvent) {
      event.preventDefault()
      const from = buckets.find((b) => b.id === fromId)
      const to = buckets.find((b) => b.id === toId)
      const value = toMinorUnits(amount, currency)
      if (!from || !to || from.id === to.id || value <= 0) return
      await moveMoney(from, to, value, on, monthKey, reason.trim() || null, currency)
      toast(t("plan.moved", { amount: money(value), from: from.name, to: to.name }))
      onClose()
    },
  }
}

export type MoveMoneyModel = ReturnType<typeof useMoveMoney>
