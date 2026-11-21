import { useMemo } from "react"
import { useTranslation } from "react-i18next"

import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { CurrencyCatalogue } from "@mizan/core/market/currency"
import { IRAQ } from "@mizan/core/market/currency"
import { useCountryName } from "./useCurrencies"

/** Iraq first, then every offered country by name in the app's language. */
export function CountrySelect({ id, value, onChange, catalogue }: {
  id?: string
  value: string
  onChange: (code: string) => void
  catalogue: CurrencyCatalogue | undefined
}) {
  const { i18n } = useTranslation()
  const name = useCountryName()
  const others = useMemo(
    () => (catalogue?.countries ?? []).map((c) => c.code).filter((c) => c !== IRAQ).sort((a, b) => name(a).localeCompare(name(b), i18n.language)),
    [catalogue, name, i18n.language],
  )
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger id={id} className="w-full"><SelectValue>{name(value)}</SelectValue></SelectTrigger>
      <SelectContent className="max-h-80">
        <SelectItem value={IRAQ}>{name(IRAQ)}</SelectItem>
        <SelectSeparator />
        {others.map((code) => <SelectItem key={code} value={code}>{name(code)}</SelectItem>)}
      </SelectContent>
    </Select>
  )
}
