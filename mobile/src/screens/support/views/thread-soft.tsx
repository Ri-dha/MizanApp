import { useTranslation } from "react-i18next"
import { View } from "react-native"

import { Button } from "@/components/button"
import { TextField } from "@/components/text-field"
import { ThemedText } from "@/components/themed-text"
import { makeStyles, radius, spacing } from "@/theme"
import { ImagesField, ReportImage } from "../images"
import { MAX_BODY, type ReplyFormModel, type ThreadModel } from "../use-thread-screen"

/** Soft: each message a card, the team's on the surface and the person's own tinted and set towards the end edge. */
export function ThreadSoft({ model }: { model: ThreadModel }) {
  const styles = useStyles()
  return (
    <View style={styles.thread}>
      {model.messages.map((message) => (
        <View key={message.id} testID={`report-message-${message.id}`} style={[styles.message, message.mine ? styles.mine : styles.theirs]}>
          <View style={styles.meta}>
            <ThemedText variant="subhead" style={styles.author}>{message.author}</ThemedText>
            <ThemedText variant="caption">{message.when}</ThemedText>
          </View>
          {message.body ? <ThemedText selectable style={styles.body}>{message.body}</ThemedText> : null}
          {message.images.length > 0 ? (
            <View style={styles.images}>
              {message.images.map(({ image, number }) => <ReportImage key={image.id} reportId={model.reportId} image={image} number={number} />)}
            </View>
          ) : null}
        </View>
      ))}
    </View>
  )
}

/** Soft: the reply box, its hint, the pictures and one wide button. */
export function ReplyFormSoft({ model }: { model: ReplyFormModel }) {
  const { t } = useTranslation()
  const styles = useStyles()
  return (
    <View style={styles.reply}>
      <TextField testID="report-reply" label={t("support.reply")} multiline maxLength={MAX_BODY} value={model.body} onChangeText={model.setBody} editable={!model.busy} style={styles.multiline} />
      {model.hint ? <ThemedText variant="caption">{model.hint}</ThemedText> : null}
      <ImagesField images={model.images} onChange={model.setImages} disabled={model.busy} />
      <Button testID="report-reply-send" title={model.busy ? t("support.sending") : t("support.send")} loading={model.busy} disabled={model.empty} onPress={model.send} />
    </View>
  )
}

const useStyles = makeStyles((colors) => ({
  thread: { gap: spacing.sm },
  message: { gap: spacing.sm, padding: spacing.md, borderRadius: radius.md, borderCurve: "continuous", backgroundColor: colors.surface, boxShadow: "0 1px 2px rgba(16, 40, 48, 0.12)" },
  mine: { marginStart: spacing.lg, backgroundColor: colors.accent, boxShadow: "none" },
  theirs: { marginEnd: spacing.lg },
  meta: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", alignItems: "baseline", gap: spacing.sm },
  author: { color: colors.label, fontWeight: "600" },
  body: { writingDirection: "auto" },
  images: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  reply: { gap: spacing.md },
  multiline: { minHeight: 96, textAlignVertical: "top" },
}))
