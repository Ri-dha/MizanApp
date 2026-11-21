import { useTranslation } from "react-i18next"
import { Link } from "react-router"

import { useSession } from "@/api/auth"
import { usePreferences } from "@/app/preferences"
import { useIraqi } from "@/app/region"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useMetals } from "@/features/metals/useMetals"
import { formatNumber } from "@mizan/core/domain/digits"
import { trackedCurrencies, unitRate } from "@mizan/core/market/currency"
import { DollarTodayCard } from "./DollarTodayCard"

const SHOWN = 4

/** The home rates widget: the Baghdad dollar for people in Iraq, the first followed currencies for everyone else. */
export function RatesTodayCard({ title }: { title?: string | null }) {
  const iraqi = useIraqi()
  return iraqi ? <DollarTodayCard title={title} /> : <FollowedRatesCard title={title} />
}

function FollowedRatesCard({ title }: { title?: string | null }) {
  const { t, i18n } = useTranslation()
  const { digitStyle } = usePreferences()
  const session = useSession()
  const { prices } = useMetals()
  const base = session?.baseCurrency ?? "USD"
  const rows = trackedCurrencies(session)
    .map((code) => ({ code, rate: unitRate(code, base, prices.perUsd) }))
    .filter((r): r is { code: string; rate: number } => r.rate !== null)
    .slice(0, SHOWN)
  if (rows.length === 0) return null
  const number = (v: number) => formatNumber(v, i18n.language, v >= 100 ? { maximumFractionDigits: 0 } : v >= 1 ? { maximumFractionDigits: 2 } : { maximumSignificantDigits: 4 }, digitStyle)
  return (
    <Card>
      <CardHeader><CardTitle>{title || t("worldRates.today", { base })}</CardTitle></CardHeader>
      <CardContent className="flex flex-wrap items-end justify-between gap-4">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:grid-cols-4">
          {rows.map((r) => (
            <div key={r.code}>
              <dt className="text-muted-foreground">1 {r.code}</dt>
              <dd className="text-lg font-semibold tabular-nums">{number(r.rate)} {base}</dd>
            </div>
          ))}
        </dl>
        <Button asChild variant="outline"><Link to="/prices">{t("prices.open")}</Link></Button>
      </CardContent>
    </Card>
  )
}
