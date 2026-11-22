import { viewFor } from "@mizan/core/domain/appStyle"
import { useAppStyle } from "@/theme"
import { useDealerProducts } from "./use-dealer-products"
import { DealerProductsSoft } from "./views/dealer-products-soft"

/** ADR styles-1: each template draws the card its own way; a template without a view of its own gets Soft. */
const VIEWS = { soft: DealerProductsSoft }

export function DealerProducts({ currency }: { currency: string }) {
  const model = useDealerProducts(currency)
  const View = viewFor(VIEWS, useAppStyle())
  return model ? <View model={model} /> : null
}
