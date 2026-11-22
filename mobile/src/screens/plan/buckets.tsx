import { Stack } from "expo-router"
import { useTranslation } from "react-i18next"

import { viewFor } from "@mizan/core/domain/appStyle"
import { Button } from "@/components/button"
import { Screen } from "@/components/screen"
import { useAppStyle } from "@/theme"
import { useBucketsScreen } from "./use-buckets-screen"
import { BucketsSoft } from "./views/buckets-soft"

/** ADR styles-1: each template draws the screen its own way; a template without a view of its own gets Soft. */
const VIEWS = { soft: BucketsSoft }

export function PlanBuckets({ monthKey }: { monthKey: string }) {
  const { t } = useTranslation()
  const model = useBucketsScreen(monthKey)
  const View = viewFor(VIEWS, useAppStyle())
  return (
    <Screen>
      <Stack.Screen options={{ title: t("plan.buckets"), headerRight: () => <Button testID="save-plan" variant="ghost" title={t("plan.save")} disabled={!model.changed} onPress={model.save} /> }} />
      <View model={model} />
    </Screen>
  )
}
