import { useTranslation } from "react-i18next"
import { formatWhen } from "@/app/dates"

export function useWhen() {
  const { i18n } = useTranslation()
  return (iso: string) => formatWhen(iso, i18n.language)
}
