import { Link, Stack } from "expo-router"
import { useTranslation } from "react-i18next"

import { viewFor } from "@mizan/core/domain/appStyle"
import { Button } from "@/components/button"
import { Screen } from "@/components/screen"
import { useAppStyle } from "@/theme"
import { usePlanScreen } from "./use-plan-screen"
import { PlanClear } from "./views/plan-clear"
import { PlanMizan } from "./views/plan-mizan"
import { PlanSoft } from "./views/plan-soft"

/** ADR styles-1: each template draws the screen its own way; a template without a view of its own gets Soft. */
const VIEWS = { soft: PlanSoft, clear: PlanClear, mizan: PlanMizan }

export function Plan() {
  const { t } = useTranslation()
  const model = usePlanScreen()
  const View = viewFor(VIEWS, useAppStyle())
  return (
    <Screen>
      <Stack.Screen
        options={{
          title: t("plan.title"),
          headerRight: () => (
            <Link href={{ pathname: "/plan-buckets", params: { monthKey: model.monthKey } }} asChild>
              <Button testID="edit-buckets" variant="ghost" title={t("plan.buckets")} />
            </Link>
          ),
        }}
      />
      <View model={model} />
    </Screen>
  )
}
