import { Stack } from "expo-router"
import { useTranslation } from "react-i18next"

import { ResetPassword } from "@/screens/reset-password"

export default function ResetPasswordScreen() {
  const { t } = useTranslation()
  return (
    <>
      <Stack.Screen options={{ title: t("auth.resetTitle") }} />
      <ResetPassword />
    </>
  )
}
