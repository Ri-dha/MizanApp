import { useState } from "react"
import { useTranslation } from "react-i18next"
import { View } from "react-native"

import { Button } from "@/components/button"
import { TextField } from "@/components/text-field"
import { ThemedText } from "@/components/themed-text"
import type { ReportDetail, ReportStatus } from "@/platform/support"
import { radius, spacing, useBrandColors, makeStyles, useColors } from "@/theme"
import { ImagesField, ReportImage } from "./images"
import { formatWhen } from "@/utils/dates"

export const MAX_BODY = 4000

export function useWhen() {
  const { i18n } = useTranslation()
  return (iso: string) => formatWhen(iso, i18n.language)
}

export function StatusBadge({ status }: { status: ReportStatus }) {
  const styles = useStyles()
  const colors = useColors()
  const { t } = useTranslation()
  const brand = useBrandColors()
  const active = status === "IN_PROGRESS"
  return (
    <View style={[styles.badge, { backgroundColor: active ? brand.primary : colors.fill }]}>
      <ThemedText variant="caption" style={{ color: active ? brand.onPrimary : colors.label }}>{t(`support.status.${status}`)}</ThemedText>
    </View>
  )
}

/** The conversation, oldest first; the person's own messages sit towards the end edge. */
export function ReportThread({ report }: { report: ReportDetail }) {
  const styles = useStyles()
  const { t } = useTranslation()
  const when = useWhen()
  let imageNumber = 0
  return (
    <View style={styles.thread}>
      {report.messages.map((message) => (
        <View key={message.id} testID={`report-message-${message.id}`} style={[styles.message, message.fromOperator ? styles.theirs : styles.mine]}>
          <View style={styles.meta}>
            <ThemedText variant="subhead" style={styles.author}>{message.fromOperator ? t("support.team") : t("support.you")}</ThemedText>
            <ThemedText variant="caption">{when(message.createdAt)}</ThemedText>
          </View>
          {message.body ? <ThemedText selectable style={styles.body}>{message.body}</ThemedText> : null}
          {message.attachments.length > 0 ? (
            <View style={styles.images}>
              {message.attachments.map((image) => <ReportImage key={image.id} reportId={report.id} image={image} number={++imageNumber} />)}
            </View>
          ) : null}
        </View>
      ))}
    </View>
  )
}

export function ReplyForm({ onSend, hint }: { onSend: (body: string, images: string[]) => Promise<boolean>; hint?: string }) {
  const styles = useStyles()
  const { t } = useTranslation()
  const [body, setBody] = useState("")
  const [images, setImages] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const empty = !body.trim() && images.length === 0

  async function send() {
    if (empty) return
    setBusy(true)
    const sent = await onSend(body.trim(), images)
    setBusy(false)
    if (sent) {
      setBody("")
      setImages([])
    }
  }

  return (
    <View style={styles.reply}>
      <TextField testID="report-reply" label={t("support.reply")} multiline maxLength={MAX_BODY} value={body} onChangeText={setBody} editable={!busy} style={styles.multiline} />
      {hint ? <ThemedText variant="caption">{hint}</ThemedText> : null}
      <ImagesField images={images} onChange={setImages} disabled={busy} />
      <Button testID="report-reply-send" title={busy ? t("support.sending") : t("support.send")} loading={busy} disabled={empty} onPress={() => void send()} />
    </View>
  )
}

const useStyles = makeStyles((colors) => ({
  badge: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs / 2, borderRadius: radius.full, alignSelf: "flex-start" },
  thread: { gap: spacing.sm },
  message: { gap: spacing.sm, padding: spacing.md, borderRadius: radius.md, borderCurve: "continuous", backgroundColor: colors.surface },
  mine: { marginStart: spacing.lg },
  theirs: { marginEnd: spacing.lg },
  meta: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", alignItems: "baseline", gap: spacing.sm },
  author: { color: colors.label, fontWeight: "600" },
  body: { writingDirection: "auto" },
  images: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  reply: { gap: spacing.md },
  multiline: { minHeight: 96, textAlignVertical: "top" },
}))
