import { useTranslation } from "react-i18next"
import { Pressable } from "react-native"

import { setPreferences } from "@/preferences"
import { useShownCurrency } from "@/utils/display-rates"
import { Notice } from "./notice"

/** While amounts are shown converted, says so and turns it off with one tap. */
export function ShownCurrencyBadge() {
  const { t } = useTranslation()
  const shown = useShownCurrency()
  if (!shown) return null
  return (
    <Pressable testID="shown-currency" accessibilityRole="button" accessibilityLabel={t("currency.showingOff")} onPress={() => setPreferences({ displayCurrency: null })}>
      <Notice>{`${t("currency.showing", { currency: shown })} · ${t("currency.showingOff")}`}</Notice>
    </Pressable>
  )
}
