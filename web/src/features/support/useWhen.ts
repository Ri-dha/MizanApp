import { useTranslation } from "react-i18next"

export function useWhen() {
  const { i18n } = useTranslation()
  return (iso: string) => new Intl.DateTimeFormat(i18n.language === "ar" ? "ar-IQ" : "en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso))
}
