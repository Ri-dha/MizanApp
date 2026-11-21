import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { Image, Modal, Pressable, StyleSheet, View } from "react-native"

import { Button } from "@/components/button"
import { Notice } from "@/components/notice"
import { ThemedText } from "@/components/themed-text"
import { MAX_REPORT_IMAGES, pickReportImages, reportImageUri, type ReportAttachment } from "@/platform/support"
import { colors, radius, spacing } from "@/theme"

const THUMB = 80

/** Up to four images to send, shrunk on this phone; each thumbnail can be taken out again. */
export function ImagesField({ images, onChange, disabled }: { images: string[]; onChange: (images: string[]) => void; disabled?: boolean }) {
  const { t } = useTranslation()
  const [preparing, setPreparing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function add() {
    setError(null)
    setPreparing(true)
    try {
      onChange([...images, ...(await pickReportImages(MAX_REPORT_IMAGES - images.length))])
    } catch {
      setError(t("support.imageUnreadable"))
    } finally {
      setPreparing(false)
    }
  }

  return (
    <View style={styles.field}>
      {images.length > 0 ? (
        <View style={styles.thumbs}>
          {images.map((uri, i) => (
            <View key={uri} style={styles.thumb}>
              <Image source={{ uri }} style={styles.fill} accessibilityLabel={t("support.imageAlt", { number: i + 1 })} />
              <Pressable
                testID={`report-image-remove-${i}`}
                accessibilityRole="button"
                accessibilityLabel={t("support.removeImage", { number: i + 1 })}
                disabled={disabled}
                hitSlop={spacing.sm}
                onPress={() => onChange(images.filter((_, j) => j !== i))}
                style={styles.remove}
              >
                <ThemedText variant="caption" style={styles.removeMark}>✕</ThemedText>
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}
      {images.length < MAX_REPORT_IMAGES ? (
        <Button testID="report-add-image" variant="secondary" title={t("support.addImage")} loading={preparing} disabled={disabled} onPress={() => void add()} style={styles.add} />
      ) : null}
      <ThemedText variant="caption">{t("support.imageHint", { count: MAX_REPORT_IMAGES })}</ThemedText>
      {error ? <Notice tone="error">{error}</Notice> : null}
    </View>
  )
}

/** A sent image, fetched with the session's token; tapping it opens it full screen. */
export function ReportImage({ reportId, image, number }: { reportId: string; image: ReportAttachment; number: number }) {
  const { t } = useTranslation()
  const [uri, setUri] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)
  const [open, setOpen] = useState(false)
  const label = t("support.imageAlt", { number })

  useEffect(() => {
    let live = true
    reportImageUri(reportId, image).then((loaded) => live && setUri(loaded)).catch(() => live && setFailed(true))
    return () => {
      live = false
    }
  }, [reportId, image])

  if (failed) return <View style={[styles.thumb, styles.placeholder]}><ThemedText variant="caption">{t("support.imageFailed")}</ThemedText></View>
  if (!uri) return <View style={[styles.thumb, styles.placeholder]} />
  return (
    <>
      <Pressable testID={`report-image-${image.id}`} accessibilityRole="imagebutton" accessibilityLabel={t("support.openImage", { number })} onPress={() => setOpen(true)} style={styles.thumb}>
        <Image source={{ uri }} style={styles.fill} accessibilityLabel={label} />
      </Pressable>
      <Modal visible={open} animationType="fade" onRequestClose={() => setOpen(false)} supportedOrientations={["portrait", "landscape"]}>
        <Pressable testID="report-image-close" accessibilityRole="button" accessibilityLabel={t("support.closeImage")} style={styles.viewer} onPress={() => setOpen(false)}>
          <Image source={{ uri }} style={styles.fill} resizeMode="contain" accessibilityLabel={label} />
        </Pressable>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  field: { gap: spacing.sm },
  thumbs: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  thumb: { width: THUMB, height: THUMB, borderRadius: radius.md, borderCurve: "continuous", overflow: "hidden", backgroundColor: colors.fill },
  placeholder: { alignItems: "center", justifyContent: "center", padding: spacing.xs },
  fill: { width: "100%", height: "100%" },
  remove: { position: "absolute", top: spacing.xs, end: spacing.xs, width: spacing.lg, height: spacing.lg, borderRadius: radius.full, alignItems: "center", justifyContent: "center", backgroundColor: colors.surface },
  removeMark: { color: colors.label },
  add: { alignSelf: "flex-start" },
  viewer: { flex: 1, backgroundColor: "#000" },
})
