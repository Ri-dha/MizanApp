import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router"
import * as SplashScreen from "expo-splash-screen"
import { useEffect, useState } from "react"
import { StyleSheet, Text, useColorScheme, View } from "react-native"

import { PlatformContext, type PlatformInfo } from "@/platform/context"
import "@/i18n"
import { installPlatform } from "@/platform/install"
import { spacing } from "@/theme"

SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  const colorScheme = useColorScheme()
  const [info, setInfo] = useState<PlatformInfo | null>(null)
  const [failure, setFailure] = useState<string | null>(null)

  useEffect(() => {
    installPlatform()
      .then(setInfo)
      .catch((error: unknown) => setFailure(error instanceof Error ? error.message : String(error)))
      .finally(() => SplashScreen.hideAsync())
  }, [])

  if (failure) {
    return (
      <View style={styles.failure}>
        <Text testID="platform-failure">{failure}</Text>
      </View>
    )
  }
  if (!info) return null
  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <PlatformContext.Provider value={info}>
        <Stack>
          <Stack.Screen name="add-transaction" options={{ presentation: "formSheet", sheetAllowedDetents: "fitToContents", sheetGrabberVisible: true }} />
        </Stack>
      </PlatformContext.Provider>
    </ThemeProvider>
  )
}

const styles = StyleSheet.create({
  failure: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.lg },
})
