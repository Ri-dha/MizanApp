import { Stack } from "expo-router"
import { useTranslation } from "react-i18next"

import { Verify } from "@/screens/verify"

export default function VerifyScreen() {
  const { t } = useTranslation()
  return (
    <>
      <Stack.Screen options={{ title: t("auth.verifyTitle") }} />
      <Verify />
    </>
  )
}
