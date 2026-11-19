import { NativeTabs } from "expo-router/native-tabs"
import { useTranslation } from "react-i18next"

import { useSession } from "@/hooks/use-core"
import { useBrandColors } from "@/theme"
import { audienceOf } from "@/utils/roles"

export default function TabLayout() {
  const { t } = useTranslation()
  const brand = useBrandColors()
  const audience = audienceOf(useSession())
  return (
    <NativeTabs tintColor={brand.primary} minimizeBehavior="onScrollDown">
      <NativeTabs.Trigger name="(home)">
        <NativeTabs.Trigger.Icon sf={{ default: "house", selected: "house.fill" }} md="home" />
        <NativeTabs.Trigger.Label>{audience === "ADVISOR" ? t("advisor.nav") : t("nav.home")}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="(ledger)" hidden={audience === "ADVISOR"}>
        <NativeTabs.Trigger.Icon sf="list.bullet.rectangle" md="receipt_long" />
        <NativeTabs.Trigger.Label>{t("nav.transactions")}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="(plan)" hidden={audience !== "FULL"}>
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
