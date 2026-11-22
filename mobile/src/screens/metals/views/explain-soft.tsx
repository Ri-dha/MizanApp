import { View } from "react-native"

import { Banner, Card } from "@/components/soft-kit"
import { ThemedText } from "@/components/themed-text"
import { makeStyles, radius, spacing } from "@/theme"
import type { ExplainScreenModel } from "../use-explain-screen"

/** Soft: the steps as a numbered list in one card, and the answer they lead to in a gold card under it. */
export function ExplainSoft({ model }: { model: ExplainScreenModel }) {
  const styles = useStyles()
  return (
    <>
      <Card>
        {model.steps.map((step, index) => (
          <View key={index} style={styles.step}>
            <View style={styles.number}><ThemedText style={styles.numberText}>{String(index + 1)}</ThemedText></View>
            <ThemedText style={styles.text}>{step}</ThemedText>
          </View>
        ))}
      </Card>
      <Card tone="gold">
        <ThemedText variant="headline">{`${model.steps.length + 1}. ${model.result}`}</ThemedText>
      </Card>
      {model.sourceNote ? <Banner>{model.sourceNote}</Banner> : null}
    </>
  )
}

const useStyles = makeStyles((colors) => ({
  step: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm + spacing.xs },
  number: { width: 24, height: 24, borderRadius: radius.full, alignItems: "center", justifyContent: "center", backgroundColor: colors.accent },
  numberText: { fontSize: 13, lineHeight: 18, fontWeight: "600", color: colors.onAccent },
  text: { flex: 1 },
}))
