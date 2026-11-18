import { Stack } from "expo-router"

import { Diagnostics } from "@/screens/diagnostics"

export default function DiagnosticsScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Diagnostics" }} />
      <Diagnostics />
    </>
  )
}
