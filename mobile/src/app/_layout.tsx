import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router"
import * as SplashScreen from "expo-splash-screen"
import { useEffect, useState } from "react"
import { StyleSheet, Text, useColorScheme, View } from "react-native"

import { AccountGate } from "@/components/account-gate"
import { useSession } from "@/hooks/use-core"
import { PrivacyCover } from "@/components/privacy-cover"
import { PlatformContext, type PlatformInfo } from "@/platform/context"
import "@/i18n"
import { installPlatform } from "@/platform/install"
import { openRemindersOnTap } from "@/platform/push"
import { spacing } from "@/theme"
import { DisplayRatesSync } from "@/utils/display-rates"
import { SyncedPreferencesSync } from "@/utils/synced-preferences"
import { usePreferences } from "@/preferences"

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
        <AccountGate>
          <Routes />
        </AccountGate>
        <PrivacyCover />
      </PlatformContext.Provider>
    </ThemeProvider>
  )
}

/** Protected groups: signed-out screens and signed-in screens never share a stack (Expo Router redirects on a change). */
function Routes() {
  const session = useSession()
  const signedIn = !!session
  useEffect(() => (signedIn ? openRemindersOnTap() : undefined), [signedIn])
  // Screens format amounts as they render and stay mounted, so these two settings redraw them all.
  const { displayCurrency, digitStyle } = usePreferences()
  return (
    <>
      {signedIn ? <><DisplayRatesSync /><SyncedPreferencesSync /></> : null}
      {/* The screen under a pushed page is the tab group, whose name "(tabs)" would show as the back label. */}
      <Stack key={`${displayCurrency ?? ""}|${digitStyle}`} screenOptions={{ headerBackButtonDisplayMode: "minimal" }}>
        {/* Without a target, signing out fell back to the last signed-out screen (reset password). */}
        <Stack.Protected guard={signedIn} redirectTo="/sign-in">
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="transaction" options={{ presentation: "formSheet", sheetAllowedDetents: [0.6, 1], sheetGrabberVisible: true }} />
          <Stack.Screen name="move-money" options={{ presentation: "formSheet", sheetAllowedDetents: [0.7, 1], sheetGrabberVisible: true }} />
          <Stack.Screen name="plan-buckets" />
          <Stack.Screen name="goal" options={{ presentation: "formSheet", sheetAllowedDetents: [0.7, 1], sheetGrabberVisible: true }} />
          <Stack.Screen name="metal-lot" options={{ presentation: "formSheet", sheetAllowedDetents: [0.8, 1], sheetGrabberVisible: true }} />
          <Stack.Screen name="metal-sell" options={{ presentation: "formSheet", sheetAllowedDetents: [0.8, 1], sheetGrabberVisible: true }} />
          <Stack.Screen name="metal-override" options={{ presentation: "formSheet", sheetAllowedDetents: [0.7, 1], sheetGrabberVisible: true }} />
          <Stack.Screen name="metal-zakat" options={{ presentation: "formSheet", sheetAllowedDetents: [0.8, 1], sheetGrabberVisible: true }} />
          <Stack.Screen name="metal-settings" options={{ presentation: "formSheet", sheetAllowedDetents: [0.8, 1], sheetGrabberVisible: true }} />
          <Stack.Screen name="metal-explain" options={{ presentation: "formSheet", sheetAllowedDetents: [0.6, 1], sheetGrabberVisible: true }} />
          {/* The invitation loads after the sheet opens, so a sheet fitted to its first contents would cut off the Join button. */}
          <Stack.Screen name="join/[token]" options={{ presentation: "formSheet", sheetAllowedDetents: [0.45, 1], sheetGrabberVisible: true }} />
          <Stack.Screen name="household-delete" options={{ presentation: "formSheet", sheetAllowedDetents: "fitToContents", sheetGrabberVisible: true }} />
          <Stack.Screen name="asset-edit" options={{ presentation: "formSheet", sheetAllowedDetents: [0.8, 1], sheetGrabberVisible: true }} />
          <Stack.Screen name="asset-action" options={{ presentation: "formSheet", sheetAllowedDetents: "fitToContents", sheetGrabberVisible: true }} />
          <Stack.Screen name="account-edit" options={{ presentation: "formSheet", sheetAllowedDetents: [0.7, 1], sheetGrabberVisible: true }} />
          <Stack.Screen name="account-transfer" options={{ presentation: "formSheet", sheetAllowedDetents: [0.7, 1], sheetGrabberVisible: true }} />
          <Stack.Screen name="income-source" options={{ presentation: "formSheet", sheetAllowedDetents: [0.8, 1], sheetGrabberVisible: true }} />
          <Stack.Screen name="income-receipt" options={{ presentation: "formSheet", sheetAllowedDetents: [0.6, 1], sheetGrabberVisible: true }} />
          <Stack.Screen name="bill-edit" options={{ presentation: "formSheet", sheetAllowedDetents: [0.8, 1], sheetGrabberVisible: true }} />
          <Stack.Screen name="bill-paid" options={{ presentation: "formSheet", sheetAllowedDetents: "fitToContents", sheetGrabberVisible: true }} />
          <Stack.Screen name="debt-edit" options={{ presentation: "formSheet", sheetAllowedDetents: [0.8, 1], sheetGrabberVisible: true }} />
          <Stack.Screen name="goal-entry" options={{ presentation: "formSheet", sheetAllowedDetents: "fitToContents", sheetGrabberVisible: true }} />
          <Stack.Screen name="sync" />
          <Stack.Screen name="home-layout" />
          <Stack.Screen name="tour" options={{ presentation: "formSheet", sheetAllowedDetents: "fitToContents", sheetGrabberVisible: true }} />
          <Stack.Screen name="verify" />
          <Stack.Screen name="diagnostics" />
        </Stack.Protected>
        <Stack.Protected guard={!signedIn}>
          <Stack.Screen name="sign-in" options={{ headerShown: false }} />
          <Stack.Screen name="register" />
          <Stack.Screen name="reset" />
        </Stack.Protected>
      </Stack>
    </>
  )
}

const styles = StyleSheet.create({
  failure: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.lg },
})
