import { useMemo } from "react"
import { useTranslation } from "react-i18next"

import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useSession } from "@/api/auth"
import { cn } from "@/lib/utils"
import { useCatalogue, useCurrencyName } from "./useCurrencies"

const COMMON = ["USD", "EUR", "IQD", "GBP", "TRY", "SAR", "AED"]

/** The household's currency and the common ones first, then every offered currency by name. */
export function CurrencySelect({ id, value, onChange, className, codes }: {
  id?: string
  value: string
  onChange: (code: string) => void
  className?: string
  /** Limits the choice, e.g. to currencies with a rate; defaults to every offered currency. */
  codes?: string[]
}) {
  const { t, i18n } = useTranslation()
  const session = useSession()
  const catalogue = useCatalogue()
  const name = useCurrencyName()
  const base = session?.baseCurrency ?? "IQD"

  const { top, rest } = useMemo(() => {
    const offered = new Set(codes ?? catalogue?.currencies ?? [base, "USD"])
    offered.add(value)
    const first = [...new Set([base, ...(session?.trackedCurrencies ?? []), ...COMMON])].filter((c) => offered.has(c))
    const others = [...offered].filter((c) => !first.includes(c)).sort((a, b) => name(a).localeCompare(name(b), i18n.language))
    return { top: first, rest: others }
  }, [codes, catalogue, base, session?.trackedCurrencies, value, name, i18n.language])

  const item = (code: string) => <SelectItem key={code} value={code}>{code} · {name(code)}</SelectItem>
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger id={id} className={cn("w-full", className)}><SelectValue>{value}</SelectValue></SelectTrigger>
      <SelectContent className="max-h-80">
        <SelectGroup>{top.map(item)}</SelectGroup>
        {rest.length > 0 && (
          <>
            <SelectSeparator />
            <SelectGroup>
              <SelectLabel>{t("currency.all")}</SelectLabel>
              {rest.map(item)}
            </SelectGroup>
          </>
        )}
      </SelectContent>
    </Select>
  )
}
