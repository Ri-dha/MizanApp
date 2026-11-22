import { useTranslation } from "react-i18next"
import { View } from "react-native"

import { Button } from "@/components/button"
import { Notice } from "@/components/notice"
import { Badge, Card } from "@/components/soft-kit"
import { ThemedText } from "@/components/themed-text"
import { makeStyles, spacing } from "@/theme"
import type { JoinScreenModel } from "../use-join-screen"

/** Soft: one card naming the household with the role as a badge, the sentence and when the link ends, then one wide button. */
export function JoinSoft({ model }: { model: JoinScreenModel }) {
  const { t } = useTranslation()
  const styles = useStyles()
  const { invitation } = model
  return (
    <>
      {model.error ? <Notice tone="error">{model.error}</Notice> : null}
      {invitation ? (
        <>
          <Card>
            <View style={styles.head}>
              <ThemedText variant="headline" numberOfLines={1} style={styles.grow}>{invitation.household}</ThemedText>
              <Badge tone="info">{invitation.role}</Badge>
            </View>
            <ThemedText testID="join-preview">{invitation.body}</ThemedText>
            <ThemedText variant="caption">{invitation.expires}</ThemedText>
          </Card>
          <Button testID="confirm-join" size="lg" title={t("household.join")} loading={model.busy} onPress={model.join} />
        </>
      ) : null}
    </>
  )
}

const useStyles = makeStyles(() => ({
  head: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  grow: { flex: 1 },
}))
