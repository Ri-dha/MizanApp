import { useMemo } from "react"
import { useTranslation } from "react-i18next"

import { IRAQ, type CurrencyCatalogue } from "@mizan/core/market/currency"
import { useSession } from "@/hooks/use-core"
import { useCatalogue, useCountryName, useCurrencyName } from "@/hooks/use-currency"
import { PickerField, type Option } from "./picker-field"

const COMMON = ["USD", "EUR", "IQD", "GBP", "TRY", "SAR", "AED"]

/** The household's currency and the common ones first, then every offered currency by name. */
export function CurrencyField({ label, value, onChange, codes, testID }: {
  label?: string
  value: string
  onChange: (code: string) => void
  /** Limits the choice, e.g. to currencies with a rate; defaults to every offered currency. */
  codes?: string[]
  testID?: string
}) {
  const { t, i18n } = useTranslation()
  const session = useSession()
  const catalogue = useCatalogue()
  const name = useCurrencyName()
  const base = session?.baseCurrency ?? "IQD"
  const sections = useMemo(() => {
    const offered = new Set(codes ?? catalogue?.currencies ?? [base, "USD"])
    offered.add(value)
    const top = [...new Set([base, ...(session?.trackedCurrencies ?? []), ...COMMON])].filter((c) => offered.has(c))
    const rest = [...offered].filter((c) => !top.includes(c)).sort((a, b) => name(a).localeCompare(name(b), i18n.language))
    const option = (code: string): Option => ({ code, title: code, detail: name(code) })
    return [{ data: top.map(option) }, ...(rest.length > 0 ? [{ title: t("currency.all"), data: rest.map(option) }] : [])]
  }, [codes, catalogue, base, session?.trackedCurrencies, value, name, i18n.language, t])
  return <PickerField label={label ?? t("accounts.currency")} searchLabel={t("worldRates.search")} value={value} shown={value} sections={sections} onChange={onChange} testID={testID} />
}

/** Iraq first, then every offered country by name in the app's language. */
export function CountryField({ label, value, onChange, catalogue, testID }: {
  label: string
  value: string
  onChange: (code: string) => void
  catalogue: CurrencyCatalogue | undefined
  testID?: string
}) {
  const { t, i18n } = useTranslation()
  const name = useCountryName()
  const sections = useMemo(() => {
    const others = (catalogue?.countries ?? []).map((c) => c.code).filter((c) => c !== IRAQ).sort((a, b) => name(a).localeCompare(name(b), i18n.language))
    return [{ data: [{ code: IRAQ, title: name(IRAQ) }] }, { data: others.map((code) => ({ code, title: name(code) })) }]
  }, [catalogue, name, i18n.language])
  return <PickerField label={label} searchLabel={t("currency.searchCountry")} value={value} shown={name(value)} sections={sections} onChange={onChange} testID={testID} />
}
