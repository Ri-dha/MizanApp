import { router, Stack } from "expo-router"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import { livePlans, liveBucketsOf, planFor } from "@mizan/core/db/plan"
import { createTransaction } from "@mizan/core/db/transactions"
import { monthKeyFor, todayIso } from "@mizan/core/domain/calendar/month"
import { toMinorUnits } from "@mizan/core/domain/money/format"
import { Button } from "@/components/button"
import { Screen } from "@/components/screen"
import { TextField } from "@/components/text-field"
import { useSession } from "@/hooks/use-core"

const UNIT_RATE_MICROS = 1_000_000

/** A first, expense-only quick add; the full sheet (types, buckets, split, receipt) comes with the ledger in Phase 5. */
export function AddTransaction() {
  const { t } = useTranslation()
  const session = useSession()
  const base = session?.baseCurrency ?? "IQD"
  const [amount, setAmount] = useState("")
  const [payee, setPayee] = useState("")

  async function save() {
    const occurredOn = todayIso()
    const monthKey = monthKeyFor(occurredOn, session?.monthStartDay ?? 1)
    const buckets = await liveBucketsOf(planFor(await livePlans(), monthKey)?.id)
    await createTransaction({
      type: "EXPENSE", occurredOn, monthKey, amount: toMinorUnits(amount, base), currency: base, fxRateMicros: UNIT_RATE_MICROS,
      bucketId: buckets[0]?.id ?? null, category: null, payee: payee || null, note: null, counterpartyType: null, counterpartyId: null,
      attachmentId: null, visibility: "SHARED",
    })
    router.back()
  }

  return (
    <Screen sheet>
      <Stack.Screen
        options={{
          title: t("transactions.add"),
          headerRight: () => <Button testID="save-transaction" variant="ghost" title={t("transactions.add")} disabled={!amount} onPress={() => void save()} />,
        }}
      />
      <TextField testID="new-amount" label={t("transactions.amount")} keyboardType="numeric" value={amount} onChangeText={setAmount} autoFocus />
      <TextField testID="new-payee" label={t("transactions.payee")} value={payee} onChangeText={setPayee} />
    </Screen>
  )
}
