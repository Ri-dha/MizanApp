import { router } from "expo-router"
import { useState } from "react"

import { addValuation, sellAsset } from "@mizan/core/db/assets"
import { todayIso } from "@mizan/core/domain/calendar/month"
import { toMinorUnits } from "@mizan/core/domain/money/format"
import { table } from "@mizan/core/store/store"
import { useLiveQuery } from "@/hooks/use-core"

export type AssetAction = "value" | "sell"

/** A new valuation resets the baseline that depreciation runs from; a sale moves the asset out of net worth. */
export function useAssetActionScreen({ id, kind }: { id: string; kind: AssetAction }) {
  const asset = useLiveQuery(() => table("assets").get(id), [id], undefined)
  const [amount, setAmount] = useState("")
  const [on, setOn] = useState(todayIso())
  const [note, setNote] = useState("")
  const selling = kind === "sell"

  async function save() {
    if (!asset) return
    const value = toMinorUnits(amount, asset.currency)
    if (selling) await sellAsset(asset.id, on, value)
    else await addValuation(asset, on, value, note.trim() || null)
    router.back()
  }

  return { asset, amount, setAmount, on, setOn, note, setNote, selling, ready: !!amount, save: () => void save() }
}

export type AssetActionModel = ReturnType<typeof useAssetActionScreen>
