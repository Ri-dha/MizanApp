import { router, Stack } from "expo-router"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import { liveDeposits, recordDeposit } from "@mizan/core/db/goals"
import { monthKeyFor, todayIso } from "@mizan/core/domain/calendar/month"
import { toMinorUnits } from "@mizan/core/domain/money/format"
import type { GoalDeposit } from "@mizan/core/schema"
import { table } from "@mizan/core/store/store"
import { Button } from "@/components/button"
import { DateField } from "@/components/date-field"
import { Screen } from "@/components/screen"
import { TextField } from "@/components/text-field"
import { useLiveQuery, useSession } from "@/hooks/use-core"

export function GoalEntry({ id, direction }: { id: string; direction: GoalDeposit["direction"] }) {
  const { t } = useTranslation()
  const session = useSession()
  const startDay = session?.monthStartDay ?? 1
  const goal = useLiveQuery(() => table("goals").get(id), [id], undefined)
  const [amount, setAmount] = useState("")
  const [on, setOn] = useState(todayIso())

  async function save() {
    if (!goal) return
    await recordDeposit(goal, await liveDeposits(), toMinorUnits(amount, goal.currency), direction, on, monthKeyFor(on, startDay), null)
    router.back()
  }

  const verb = t(`goals.${direction === "DEPOSIT" ? "deposit" : "withdraw"}`)
  return (
    <Screen sheet>
      <Stack.Screen options={{ title: goal ? `${verb}: ${goal.name}` : verb, headerRight: () => <Button testID="save-goal-entry" variant="ghost" title={t("accounts.save")} disabled={!amount} onPress={() => void save()} /> }} />
      <TextField testID="goal-entry-amount" label={t("income.amount")} keyboardType="decimal-pad" value={amount} onChangeText={setAmount} autoFocus />
      <DateField label={t("transactions.date")} value={on} onChange={(iso) => iso && setOn(iso)} />
    </Screen>
  )
}
