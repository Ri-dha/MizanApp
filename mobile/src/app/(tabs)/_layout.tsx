import { NativeTabs } from "expo-router/native-tabs"
import { useTranslation } from "react-i18next"

import { useAppMode } from "@/hooks/use-app-mode"
import { useSession } from "@/hooks/use-core"
import { useBrandColors, useColors } from "@/theme"
import { audienceOf } from "@/utils/roles"

export default function TabLayout() {
  const { t } = useTranslation()
  const brand = useBrandColors()
  const colors = useColors()
  const audience = audienceOf(useSession())
  const simple = useAppMode() === "simple"
  return (
    <NativeTabs
      tintColor={brand.primary}
      // Android draws its own Material colours unless each part is named; iOS 26 ignores the background.
      backgroundColor={colors.surface}
      indicatorColor={colors.accent}
      rippleColor={colors.fill}
      iconColor={{ default: colors.secondaryLabel, selected: colors.onAccent }}
      labelStyle={{ default: { color: colors.secondaryLabel }, selected: { color: colors.label } }}
      minimizeBehavior="onScrollDown"
    >
      <NativeTabs.Trigger name="(home)">
        <NativeTabs.Trigger.Icon sf={{ default: "house", selected: "house.fill" }} md="home" />
        <NativeTabs.Trigger.Label>{audience === "ADVISOR" ? t("advisor.nav") : t("nav.home")}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="(ledger)" hidden={audience === "ADVISOR"}>
        <NativeTabs.Trigger.Icon sf="list.bullet.rectangle" md="receipt_long" />
        <NativeTabs.Trigger.Label>{t("nav.transactions")}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="(plan)" hidden={audience !== "FULL" || simple}>
        <NativeTabs.Trigger.Icon sf="chart.pie" md="pie_chart" />
        <NativeTabs.Trigger.Label>{t("nav.plan")}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="(more)">
        <NativeTabs.Trigger.Icon sf="ellipsis.circle" md="more_horiz" />
        <NativeTabs.Trigger.Label>{t("nav.more")}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  )
}
