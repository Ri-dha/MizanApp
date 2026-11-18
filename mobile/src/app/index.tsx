import { Stack } from "expo-router"

import { Diagnostics } from "@/screens/diagnostics"

export default function HomeScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Mizan" }} />
      <Diagnostics />
    </>
  )
}
