import { Stack } from "expo-router"
import { useTranslation } from "react-i18next"

import { Home } from "@/screens/home"

export default function HomeScreen() {
  const { t } = useTranslation()
  return (
    <>
      <Stack.Screen options={{ title: t("app.name") }} />
      <Home />
    </>
  )
}
