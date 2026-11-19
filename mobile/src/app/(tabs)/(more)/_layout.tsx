import { Stack } from "expo-router"

/** Screens opened from Home, a reminder or a link still sit on top of the More menu, so back returns to it. */
export const unstable_settings = { initialRouteName: "more" }

export default function TabStack() {
  return <Stack screenOptions={{ headerLargeTitle: true, headerTransparent: false }} />
}
