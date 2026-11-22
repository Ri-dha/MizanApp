import { router } from "expo-router"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"

import { moveMoney } from "@mizan/core/db/plan"
import { monthKeyFor, monthWindow, todayIso } from "@mizan/core/domain/calendar/month"
import { useSession } from "@/hooks/use-core"
import { useMonthView } from "@/hooks/use-views"
import { formatMoney, toMinorUnits } from "@/utils/money"

/** A move is a transfer between two buckets, not spending, and stays in the month's audit trail. */
export function useMoveMoney(monthKey: string) {
  const { i18n } = useTranslation()
  const session = useSession()
  const startDay = session?.monthStartDay ?? 1
  const currency = session?.baseCurrency ?? "IQD"
  const view = useMonthView(monthKey, startDay)
  const [fromId, setFromId] = useState<string | null>(null)
  const [toId, setToId] = useState<string | null>(null)
  const [amount, setAmount] = useState("")
  const [reason, setReason] = useState("")
  const today = todayIso()
  const [on, setOn] = useState(monthKeyFor(today, startDay) === monthKey ? today : monthWindow(monthKey, startDay).from)

  useEffect(() => {
    if (fromId === null && view.buckets[0]) setFromId(view.buckets[0].id)
    if (toId === null && view.buckets[1]) setToId(view.buckets[1].id)
  }, [view.buckets, fromId, toId])

  const freeOf = (id: string) => view.figures.buckets.find((b) => b.id === id)?.free ?? 0
  const value = toMinorUnits(amount || "0", currency)
  const from = view.buckets.find((b) => b.id === fromId)
  const to = view.buckets.find((b) => b.id === toId)

  async function move() {
    if (!from || !to) return
    await moveMoney(from, to, value, on, monthKey, reason.trim() || null, currency)
    router.back()
  }

  return {
    fromId, setFromId, toId, setToId, amount, setAmount, reason, setReason, on, setOn,
    fromOptions: view.buckets.map((b) => ({ value: b.id, label: `${b.name} · ${formatMoney(freeOf(b.id), currency, i18n.language)}`, swatch: b.colour })),
    toOptions: view.buckets.filter((b) => b.id !== fromId).map((b) => ({ value: b.id, label: b.name, swatch: b.colour })),
    ready: !!from && !!to && from.id !== to.id && value > 0,
    move: () => void move(),
  }
}

export type MoveMoneyModel = ReturnType<typeof useMoveMoney>
