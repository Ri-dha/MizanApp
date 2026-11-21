import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"

import { useAppMode } from "@/app/appMode"
import { setPreferences } from "@/app/preferences"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { shows, type AdvancedArea } from "@mizan/core/domain/appMode"

/** A screen simple mode leaves out: an old link or bookmark lands on a way back in, not on a blank page. */
export function AreaGate({ area, children }: { area: AdvancedArea; children: ReactNode }) {
  const { t } = useTranslation()
  const mode = useAppMode()
  if (shows(mode, area)) return children
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("appMode.gateTitle")}</CardTitle>
        <CardDescription>{t("appMode.gateBody")}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={() => setPreferences({ appMode: "advanced" })}>{t("appMode.switchToAdvanced")}</Button>
      </CardContent>
    </Card>
  )
}
