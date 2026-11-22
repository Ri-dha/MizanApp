import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"

import { api, unwrap } from "@mizan/core/api/client"
import { readMeta, writeMeta } from "@mizan/core/db/meta"
import { formatWhen } from "@/utils/dates"
import { formatMoney } from "@/utils/money"

interface Item { id: string; name_ar: string; name_en: string; bid_iqd: number; ask_iqd: number }
interface ProductGroup { key: string; title_ar: string; title_en: string; items: Item[] }
interface Catalogue { source: string; asOf: string; groups: ProductGroup[] }

const KEY = "market.catalogue"

/** The dealer's bars and coins with what they pay (bid) and charge (ask), as the feed lists them; null until a list is known. */
export function useDealerProducts(currency: string) {
  const { t, i18n } = useTranslation()
  const [catalogue, setCatalogue] = useState<Catalogue | null>(null)
  const [open, setOpen] = useState(false)
  const ar = i18n.language === "ar"
  const money = (v: number) => formatMoney(Math.round(v), currency, i18n.language)

  useEffect(() => {
    let live = true
    void (async () => {
      const cached = await readMeta<Catalogue>(KEY)
      if (cached && live) setCatalogue(cached)
      try {
        const response = await unwrap(api().GET("/api/v1/market/catalogue"))
        if (response?.catalogue) {
          const next = { source: response.source ?? "", asOf: response.asOf ?? "", groups: response.catalogue as unknown as ProductGroup[] }
          await writeMeta(KEY, next)
          if (live) setCatalogue(next)
        }
      } catch {
        // offline or no dealer feed; the cached list stands
      }
    })()
    return () => {
      live = false
    }
  }, [])

  if (!catalogue) return null
  return {
    body: t("metals.dealerProductsBody", { source: catalogue.source, at: formatWhen(catalogue.asOf, ar ? "ar" : "en") }),
    open,
    toggle: () => setOpen(!open),
    groups: catalogue.groups.map((group) => ({
      key: group.key,
      title: ar ? group.title_ar : group.title_en,
      items: group.items.map((item) => ({ id: item.id, name: ar ? item.name_ar : item.name_en, pays: money(item.bid_iqd), charges: money(item.ask_iqd) })),
    })),
  }
}

export type DealerProductsModel = NonNullable<ReturnType<typeof useDealerProducts>>
