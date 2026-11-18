import { getLocales } from "expo-localization"
import i18n from "i18next"
import { initReactI18next } from "react-i18next"

import ar from "@mizan/core/i18n/ar.json"
import en from "@mizan/core/i18n/en.json"

export const SUPPORTED_LOCALES = ["en", "ar"] as const

const deviceLanguage = getLocales()[0]?.languageCode ?? "en"

void i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, ar: { translation: ar } },
  lng: (SUPPORTED_LOCALES as readonly string[]).includes(deviceLanguage) ? deviceLanguage : "en",
  fallbackLng: "en",
  interpolation: { escapeValue: false },
})

export default i18n
