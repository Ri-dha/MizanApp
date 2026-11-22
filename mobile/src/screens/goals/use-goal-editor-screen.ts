import { router } from "expo-router"
import { useEffect, useState } from "react"

import { liveAssets } from "@mizan/core/db/assets"
import { createGoal, updateGoal } from "@mizan/core/db/goals"
import { liveBucketsOf, livePlans, planFor } from "@mizan/core/db/plan"
import { defaultsOf, livePrivacySetting } from "@mizan/core/db/privacy"
import { writeFields } from "@mizan/core/db/write"
import { fromMinorUnits, toMinorUnits } from "@mizan/core/domain/money/format"
import type { Goal } from "@mizan/core/schema"
import { table } from "@mizan/core/store/store"
import { useLiveQuery, useSession } from "@/hooks/use-core"
import { currentMonthKey } from "@/hooks/use-views"

export function useGoalEditorScreen({ id }: { id?: string }) {
  const session = useSession()
  const base = session?.baseCurrency ?? "IQD"
  const startDay = session?.monthStartDay ?? 1
  const goal = useLiveQuery(() => (id ? table("goals").get(id) : Promise.resolve(undefined)), [id], undefined)
  const privacy = useLiveQuery(async () => defaultsOf(await livePrivacySetting()), [], defaultsOf(undefined))
  const buckets = useLiveQuery(async () => liveBucketsOf(planFor(await livePlans(), currentMonthKey(startDay))?.id), [startDay], [])
  const assets = useLiveQuery(liveAssets, [], [])
  const [name, setName] = useState("")
  const [target, setTarget] = useState("")
  const [alreadySaved, setAlreadySaved] = useState("")
  const [currency, setCurrency] = useState(base)
  const [targetDate, setTargetDate] = useState<string | null>(null)
  const [contribution, setContribution] = useState("")
  const [bucketId, setBucketId] = useState<string | null>(null)
  const [assetId, setAssetId] = useState<string | null>(null)
  const [isPrivate, setIsPrivate] = useState(false)
  const [loaded, setLoaded] = useState(!id)

  useEffect(() => {
    if (!goal || loaded) return
    setName(goal.name)
    setTarget(fromMinorUnits(goal.targetAmount, goal.currency))
    setCurrency(goal.currency)
    setAlreadySaved(goal.openingAmount ? fromMinorUnits(goal.openingAmount, goal.currency) : "")
    setTargetDate(goal.targetDate)
    setContribution(goal.monthlyContribution ? fromMinorUnits(goal.monthlyContribution, goal.currency) : "")
    setBucketId(goal.bucketId)
    setAssetId(goal.backingAssetId)
    setIsPrivate(goal.visibility === "PRIVATE")
    setLoaded(true)
  }, [goal, loaded])

  useEffect(() => {
    if (!id) setIsPrivate(privacy.goals === "PRIVATE")
  }, [id, privacy.goals])

  async function save() {
    const input = {
      name: name.trim(), targetAmount: toMinorUnits(target, currency), currency, targetDate,
      openingAmount: alreadySaved ? toMinorUnits(alreadySaved, currency) : 0,
      monthlyContribution: contribution ? toMinorUnits(contribution, currency) : null,
      bucketId, backingAssetId: assetId, note: null,
      visibility: isPrivate ? ("PRIVATE" as const) : ("SHARED" as const),
    }
    if (id) await updateGoal(id, input)
    else await createGoal(input)
    router.back()
  }

  async function archive() {
    if (!id) return
    await writeFields<Goal>("goal", id, { status: "ARCHIVED" })
    router.back()
  }

  return { id, buckets, name, setName, target, setTarget, alreadySaved, setAlreadySaved, currency, setCurrency, targetDate, setTargetDate, contribution, setContribution, bucketId, setBucketId, assetId, setAssetId, isPrivate, setIsPrivate, heldAssets: assets.filter((a) => a.status === "HELD"), ready: !!name.trim() && !!target, save: () => void save(), archive: () => void archive() }
}

export type GoalEditorModel = ReturnType<typeof useGoalEditorScreen>
