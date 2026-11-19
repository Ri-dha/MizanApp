import { router, Stack } from "expo-router"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"

import { TOURS } from "@mizan/core/tours/tours"
import { Button } from "@/components/button"
import { Screen } from "@/components/screen"
import { ThemedText } from "@/components/themed-text"
import { markSeen } from "@/tours"
import { spacing } from "@/theme"

/** The web's tours point at parts of the page; on the phone the same steps page through a sheet. */
export function Tour({ id }: { id: string }) {
  const { t } = useTranslation()
  const tour = TOURS[id]
  const [index, setIndex] = useState(0)

  useEffect(() => markSeen(id), [id])
  if (!tour) return <Screen sheet><Stack.Screen options={{ title: t("help.title") }} /></Screen>
  const step = tour.steps[index]
  const last = index === tour.steps.length - 1

  function finish(readMore: boolean) {
    markSeen(id)
    router.back()
    if (readMore) router.push({ pathname: "/help-page", params: { slug: tour.helpSlug } })
  }

  return (
    <Screen sheet>
      <Stack.Screen options={{ title: t(step.titleKey), headerRight: () => <Button testID="tour-skip" variant="ghost" title={t("tours.skip")} onPress={() => finish(false)} /> }} />
      <ThemedText variant="caption">{t("tours.progress", { step: index + 1, steps: tour.steps.length })}</ThemedText>
      <ThemedText testID="tour-body">{t(step.bodyKey)}</ThemedText>
      {last ? <ThemedText variant="subhead">{t("tours.readMore")}</ThemedText> : null}
      <View style={styles.buttons}>
        <Button testID="tour-back" variant="secondary" title={t("tours.back")} disabled={index === 0} onPress={() => setIndex(index - 1)} />
        {last ? (
          <Button testID="tour-done" title={t("tours.last")} onPress={() => finish(true)} />
        ) : (
          <Button testID="tour-next" title={t("tours.next")} onPress={() => setIndex(index + 1)} />
        )}
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  buttons: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, justifyContent: "flex-end" },
})
