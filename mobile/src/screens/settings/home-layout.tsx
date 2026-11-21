import { Stack } from "expo-router"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Modal, Pressable, ScrollView, StyleSheet, View } from "react-native"

import { liveCashAccounts } from "@mizan/core/db/cashAccounts"
import { liveDebts } from "@mizan/core/db/debts"
import { liveGoals } from "@mizan/core/db/goals"
import {
  addWidget, DEFAULT_LAYOUT, definitionOf, MAX_TITLE, moveWidget, removeWidget, saveHomeLayout, shownWidgets, updateWidget, WIDGETS,
  type HomeWidget, type WidgetDefinition, type WidgetSize,
} from "@mizan/core/db/homeLayout"
import { Button } from "@/components/button"
import { Chips } from "@/components/chips"
import { Group, Row } from "@/components/row"
import { Screen } from "@/components/screen"
import { TextField } from "@/components/text-field"
import { ThemedText } from "@/components/themed-text"
import { useLiveQuery } from "@/hooks/use-core"
import { useHomeLayout } from "@/hooks/use-home-layout"
import { colors, radius, spacing, useBrandColors } from "@/theme"

const SIZES: WidgetSize[] = ["full", "compact"]

type PickKind = NonNullable<WidgetDefinition["picks"]>

interface Choice {
  id: string
  name: string
}

/** What a cash, goals or debts card can be limited to, from the person's own records. */
function useChoices(): Record<PickKind, Choice[]> {
  const accounts = useLiveQuery(liveCashAccounts, [], [])
  const goals = useLiveQuery(liveGoals, [], [])
  const debts = useLiveQuery(liveDebts, [], [])
  return {
    accounts: accounts.map((a) => ({ id: a.id, name: `${a.name} (${a.currency})` })),
    goals: goals.filter((g) => g.status === "ACTIVE").map((g) => ({ id: g.id, name: g.name })),
    debts: debts.filter((d) => d.status === "ACTIVE").map((d) => ({ id: d.id, name: d.name })),
  }
}

/**
 * ADR home-1, T-home-templates: the cards on Home, each made from a template. A template can be
 * used more than once; each card can be renamed, sized, set up, limited to some accounts, goals
 * or debts, moved with the arrows, and removed.
 */
export function HomeLayoutEditor() {
  const { t } = useTranslation()
  const layout = useHomeLayout()
  const choices = useChoices()
  const [adding, setAdding] = useState(false)
  const save = (next: HomeWidget[]) => void saveHomeLayout(next)
  const shown = shownWidgets(layout)

  return (
    <Screen>
      <Stack.Screen options={{ title: t("homeLayout.title"), headerBackButtonDisplayMode: "minimal", headerRight: () => <Button testID="add-card" variant="ghost" title={t("homeLayout.add")} onPress={() => setAdding(true)} /> }} />
      <ThemedText variant="subhead">{t("homeLayout.body")}</ThemedText>
      {shown.length === 0 ? <ThemedText variant="subhead">{t("homeLayout.empty")}</ThemedText> : null}
      {shown.map((widget, index) => (
        <CardEditor key={widget.id} widget={widget} index={index} count={shown.length} layout={layout} save={save}
          choices={definitionOf(widget.kind)?.picks ? choices[definitionOf(widget.kind)!.picks!] : undefined} />
      ))}
      <Button testID="reset-home" variant="secondary" title={t("homeLayout.reset")} onPress={() => save(DEFAULT_LAYOUT)} />
      <SheetList
        visible={adding}
        title={t("homeLayout.templates")}
        onClose={() => setAdding(false)}
        items={WIDGETS.map((template) => ({ id: template.kind, name: t(`homeLayout.kinds.${template.kind}`) }))}
        onPick={(kind) => {
          setAdding(false)
          save(addWidget(layout, kind as HomeWidget["kind"]))
        }}
        testID="template"
      />
    </Screen>
  )
}

function CardEditor({ widget, index, count, layout, save, choices }: {
  widget: HomeWidget
  index: number
  count: number
  layout: HomeWidget[]
  save: (next: HomeWidget[]) => void
  choices: Choice[] | undefined
}) {
  const { t } = useTranslation()
  const definition = definitionOf(widget.kind)
  const templateName = t(`homeLayout.kinds.${widget.kind}`)
  const [title, setTitle] = useState(widget.title ?? "")
  const [savedTitle, setSavedTitle] = useState(widget.title ?? "")
  const [picking, setPicking] = useState(false)
  if ((widget.title ?? "") !== savedTitle) {
    setSavedTitle(widget.title ?? "")
    setTitle(widget.title ?? "")
  }
  // Saved when the field is left, not per keystroke, so typing a name is one change to sync.
  const commitTitle = () => {
    const next = title.trim().slice(0, MAX_TITLE)
    if (next !== (widget.title ?? "")) save(updateWidget(layout, widget.id, { title: next || null }))
  }
  const picked = widget.pick ?? []
  const pickKind = definition?.picks
  const pickedNames = choices?.filter((c) => picked.includes(c.id)).map((c) => c.name).join(", ")
  const togglePick = (id: string) => {
    const next = picked.includes(id) ? picked.filter((p) => p !== id) : [...picked, id]
    save(updateWidget(layout, widget.id, { pick: next }))
  }

  return (
    <Group>
      <Row>
        <View style={styles.field}>
          <TextField testID={`card-${widget.id}-title`} label={t("homeLayout.cardName", { card: templateName })} placeholder={templateName} maxLength={MAX_TITLE}
            value={title} onChangeText={setTitle} onBlur={commitTitle} onSubmitEditing={commitTitle} returnKeyType="done" />
          {widget.title ? <ThemedText variant="caption">{templateName}</ThemedText> : null}
        </View>
      </Row>
      <Row>
        <View style={styles.field}>
          <ThemedText variant="caption">{t("homeLayout.size")}</ThemedText>
          <Chips
            testID={`card-${widget.id}-size`}
            options={SIZES.map((size) => ({ value: size, label: t(`homeLayout.sizes.${size}`) }))}
            value={widget.size}
            onChange={(size) => size && save(updateWidget(layout, widget.id, { size: size as WidgetSize }))}
          />
        </View>
      </Row>
      {definition?.options.map((option) => (
        <Row key={option.key}>
          <View style={styles.field}>
            <ThemedText variant="caption">{t(`homeLayout.options.${option.key}.label`)}</ThemedText>
            <Chips
              testID={`card-${widget.id}-${option.key}`}
              options={option.values.map((value) => ({ value, label: t(`homeLayout.options.${option.key}.values.${value}`) }))}
              value={widget.options[option.key]}
              onChange={(value) => value && save(updateWidget(layout, widget.id, { options: { [option.key]: value } }))}
            />
          </View>
        </Row>
      ))}
      {pickKind && choices ? (
        <Row>
          <View style={styles.field}>
            <ThemedText variant="caption">{t(`homeLayout.picks.${pickKind}.label`)}</ThemedText>
            <Pressable testID={`card-${widget.id}-picks`} accessibilityRole="button" disabled={choices.length === 0} onPress={() => setPicking(true)}
              style={({ pressed }) => [styles.value, pressed ? styles.pressed : null]}>
              <ThemedText numberOfLines={1} style={styles.valueText}>{pickedNames || t(`homeLayout.picks.${pickKind}.all`)}</ThemedText>
              <ThemedText variant="subhead">▾</ThemedText>
            </Pressable>
          </View>
          <SheetList
            visible={picking}
            title={t(`homeLayout.picks.${pickKind}.label`)}
            hint={t("homeLayout.pickHint")}
            onClose={() => setPicking(false)}
            items={choices}
            checked={picked}
            onPick={togglePick}
            testID={`card-${widget.id}-pick`}
          />
        </Row>
      ) : null}
      <Row last>
        <View style={styles.moves}>
          <Button testID={`card-${widget.id}-up`} variant="ghost" title={`↑ ${t("homeLayout.moveUp")}`} disabled={index === 0} onPress={() => save(moveWidget(layout, widget.id, -1))} />
          <Button testID={`card-${widget.id}-down`} variant="ghost" title={`↓ ${t("homeLayout.moveDown")}`} disabled={index === count - 1} onPress={() => save(moveWidget(layout, widget.id, 1))} />
          <Button testID={`card-${widget.id}-remove`} variant="ghost" title={t("homeLayout.remove", { card: widget.title || templateName })}
            onPress={() => save(removeWidget(layout, widget.id))} />
        </View>
      </Row>
    </Group>
  )
}

/** A page sheet of choices: one tap picks and closes, or, with `checked`, ticks several and stays open. */
function SheetList({ visible, title, hint, onClose, items, checked, onPick, testID }: {
  visible: boolean
  title: string
  hint?: string
  onClose: () => void
  items: Choice[]
  checked?: string[]
  onPick: (id: string) => void
  testID: string
}) {
  const { t } = useTranslation()
  const brand = useBrandColors()
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.sheet}>
        <View style={styles.sheetHeader}>
          <ThemedText variant="headline">{title}</ThemedText>
          <Button testID={`${testID}-done`} variant="ghost" title={checked ? t("common.done") : t("common.cancel")} onPress={onClose} />
        </View>
        {hint ? <ThemedText variant="caption">{hint}</ThemedText> : null}
        <ScrollView>
          <Group>
            {items.map((item, index) => (
              <Pressable key={item.id} testID={`${testID}-${item.id}`} accessibilityRole={checked ? "checkbox" : "button"}
                accessibilityState={checked ? { checked: checked.includes(item.id) } : undefined}
                onPress={() => onPick(item.id)} style={({ pressed }) => (pressed ? styles.pressed : null)}>
                <Row last={index === items.length - 1} trailing={checked?.includes(item.id) ? <ThemedText style={{ color: brand.primary }}>✓</ThemedText> : null}>
                  <ThemedText>{item.name}</ThemedText>
                </Row>
              </Pressable>
            ))}
          </Group>
        </ScrollView>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  field: { gap: spacing.xs, flex: 1 },
  moves: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", flex: 1 },
  value: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm,
    backgroundColor: colors.fill, borderRadius: radius.md, borderCurve: "continuous", paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
  },
  valueText: { flex: 1 },
  pressed: { opacity: 0.6 },
  sheet: { flex: 1, backgroundColor: colors.background, padding: spacing.md, gap: spacing.md },
  sheetHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
})
