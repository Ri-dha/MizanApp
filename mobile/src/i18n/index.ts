import i18n from "i18next"
import { initReactI18next } from "react-i18next"

import ar from "@mizan/core/i18n/ar.json"
import en from "@mizan/core/i18n/en.json"
import { applyTheme, directionNeedsRestart, localeFor } from "@/platform/appearance"
import { preferences } from "@/preferences"

export { SUPPORTED_LOCALES } from "@/platform/appearance"

applyTheme(preferences().theme)
directionNeedsRestart(localeFor(preferences().language))

void i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, ar: { translation: ar } },
  lng: localeFor(preferences().language),
  fallbackLng: "en",
  interpolation: { escapeValue: false },
})

export default i18n
