import { useTranslation } from "react-i18next"
import { Pressable, View } from "react-native"

import type { HomeWidget } from "@mizan/core/db/homeLayout"
import { Button } from "@/components/button"
import { Chips } from "@/components/chips"
import { SoftCard } from "@/components/soft"
import { TextField } from "@/components/text-field"
import { ThemedText } from "@/components/themed-text"
import { makeStyles, radius, spacing } from "@/theme"
import { formatCount } from "@/utils/dates"
import { MAX_TITLE, SIZES, useCardEditor, type HomeLayoutModel } from "../use-home-layout-screen"
import { SheetList } from "./sheet-list"

/** Soft: one card per Home card, its place and the move arrows on top, then its name, size and what it shows. */
export function HomeLayoutSoft({ model }: { model: HomeLayoutModel }) {
  const { t } = useTranslation()
  const styles = useStyles()
  return (
    <>
      <ThemedText style={styles.body}>{t("homeLayout.body")}</ThemedText>
      {model.shown.length === 0 ? <ThemedText variant="subhead">{t("homeLayout.empty")}</ThemedText> : null}
      {model.shown.map((widget, index) => <CardEditor key={widget.id} model={model} widget={widget} index={index} />)}
      <Button testID="reset-home" variant="secondary" title={t("homeLayout.reset")} onPress={model.reset} />
    </>
  )
}

function CardEditor({ model, widget, index }: { model: HomeLayoutModel; widget: HomeWidget; index: number }) {
  const { t, i18n } = useTranslation()
  const styles = useStyles()
  const card = useCardEditor(model, widget)
  const last = index === model.shown.length - 1
  return (
    <SoftCard style={styles.card}>
      <View style={styles.top}>
        <View style={styles.place}><ThemedText style={styles.placeText}>{formatCount(index + 1, i18n.language)}</ThemedText></View>
        <ThemedText numberOfLines={1} style={styles.name}>{widget.title || card.templateName}</ThemedText>
        <Round testID={`card-${widget.id}-up`} glyph="↑" label={t("homeLayout.moveUp")} disabled={index === 0} onPress={() => model.move(index, -1)} />
        <Round testID={`card-${widget.id}-down`} glyph="↓" label={t("homeLayout.moveDown")} disabled={last} onPress={() => model.move(index, 1)} />
      </View>
      <View style={styles.field}>
        <TextField testID={`card-${widget.id}-title`} label={t("homeLayout.cardName", { card: card.templateName })} placeholder={card.templateName} maxLength={MAX_TITLE}
          value={card.title} onChangeText={card.setTitle} onBlur={card.commitTitle} onSubmitEditing={card.commitTitle} returnKeyType="done" />
        {widget.title ? <ThemedText variant="caption">{card.templateName}</ThemedText> : null}
      </View>
      <View style={styles.field}>
        <ThemedText style={styles.label}>{t("homeLayout.size")}</ThemedText>
        <Chips testID={`card-${widget.id}-size`} options={SIZES.map((size) => ({ value: size, label: t(`homeLayout.sizes.${size}`) }))} value={widget.size} onChange={card.setSize} />
      </View>
      {card.definition?.options.map((option) => (
        <View key={option.key} style={styles.field}>
          <ThemedText style={styles.label}>{t(`homeLayout.options.${option.key}.label`)}</ThemedText>
          <Chips testID={`card-${widget.id}-${option.key}`}
            options={option.values.map((value) => ({ value, label: t(`homeLayout.options.${option.key}.values.${value}`) }))}
            value={widget.options[option.key]} onChange={(value) => card.setOption(option.key, value)} />
        </View>
      ))}
      {card.pickKind && card.choices ? (
        <View style={styles.field}>
          <ThemedText style={styles.label}>{t(`homeLayout.picks.${card.pickKind}.label`)}</ThemedText>
          <Pressable testID={`card-${widget.id}-picks`} accessibilityRole="button" disabled={card.choices.length === 0} onPress={() => card.setPicking(true)}
            style={({ pressed }) => [styles.value, pressed ? styles.pressed : null]}>
            <ThemedText numberOfLines={1} style={styles.valueText}>{card.pickedNames || t(`homeLayout.picks.${card.pickKind}.all`)}</ThemedText>
            <ThemedText variant="subhead">▾</ThemedText>
          </Pressable>
          <SheetList visible={card.picking} title={t(`homeLayout.picks.${card.pickKind}.label`)} hint={t("homeLayout.pickHint")} onClose={() => card.setPicking(false)}
            items={card.choices} checked={card.picked} onPick={card.togglePick} testID={`card-${widget.id}-pick`} />
        </View>
      ) : null}
      <Pressable testID={`card-${widget.id}-remove`} accessibilityRole="button" onPress={card.remove} style={({ pressed }) => [styles.remove, pressed ? styles.pressed : null]}>
        <ThemedText style={styles.removeText}>{t("homeLayout.remove", { card: widget.title || card.templateName })}</ThemedText>
      </Pressable>
    </SoftCard>
  )
}

function Round({ glyph, label, disabled, onPress, testID }: { glyph: string; label: string; disabled: boolean; onPress: () => void; testID: string }) {
  const styles = useStyles()
  return (
    <Pressable testID={testID} accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled }} disabled={disabled} onPress={onPress}
      style={({ pressed }) => [styles.round, disabled ? styles.disabled : pressed ? styles.pressed : null]}>
      <ThemedText style={styles.glyph}>{glyph}</ThemedText>
    </Pressable>
  )
}

const useStyles = makeStyles((colors) => ({
  body: { fontSize: 14, lineHeight: 20, color: colors.secondaryLabel, paddingHorizontal: spacing.xs },
  card: { gap: spacing.md - spacing.xs },
  top: { flexDirection: "row", alignItems: "center", gap: spacing.sm + 2 },
  place: { width: 28, height: 28, borderRadius: radius.sm, alignItems: "center", justifyContent: "center", backgroundColor: colors.accent },
  placeText: { fontSize: 13, fontWeight: "700", color: colors.onAccent },
  name: { flex: 1, fontWeight: "600" },
  round: { width: 36, height: 36, borderRadius: radius.full, alignItems: "center", justifyContent: "center", backgroundColor: colors.fill },
  glyph: { fontSize: 17, fontWeight: "600" },
  disabled: { opacity: 0.4 },
  pressed: { opacity: 0.6 },
  field: { gap: spacing.xs },
  label: { fontSize: 13, lineHeight: 18, fontWeight: "500", color: colors.secondaryLabel },
  value: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm,
    backgroundColor: colors.fill, borderRadius: radius.md, borderCurve: "continuous", paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
  },
  valueText: { flex: 1 },
  remove: { alignSelf: "flex-start", paddingVertical: spacing.xs },
  removeText: { fontSize: 15, fontWeight: "500", color: colors.destructive },
}))
