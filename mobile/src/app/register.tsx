import { Stack } from "expo-router"
import { useTranslation } from "react-i18next"

import { Register } from "@/screens/register"

export default function RegisterScreen() {
  const { t } = useTranslation()
  return (
    <>
      <Stack.Screen options={{ title: t("auth.register") }} />
      <Register />
    </>
  )
}
