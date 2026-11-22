import { useState } from "react"
import { useTranslation } from "react-i18next"

import { liveCashAccounts } from "@mizan/core/db/cashAccounts"
import { liveDebts } from "@mizan/core/db/debts"
import { liveGoals } from "@mizan/core/db/goals"
import {
  addWidget, DEFAULT_LAYOUT, definitionOf, MAX_TITLE, placeWidget, removeWidget, saveHomeLayout, shownWidgets, templatesFor, updateWidget, widgetsFor,
  type HomeWidget, type WidgetDefinition, type WidgetSize,
} from "@mizan/core/db/homeLayout"
import { useAppMode } from "@/hooks/use-app-mode"
import { useLiveQuery } from "@/hooks/use-core"
import { useHomeLayout } from "@/hooks/use-home-layout"

export const SIZES: WidgetSize[] = ["full", "compact"]

type PickKind = NonNullable<WidgetDefinition["picks"]>

export interface Choice {
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
export function useHomeLayoutScreen() {
  const { t } = useTranslation()
  const layout = useHomeLayout()
  const choices = useChoices()
  const [adding, setAdding] = useState(false)
  const save = (next: HomeWidget[]) => void saveHomeLayout(next)
  const mode = useAppMode()
  // Cards simple mode leaves out stay in the saved layout, in place, for when the person switches back.
  const shown = widgetsFor(mode, shownWidgets(layout))
  return {
    layout, shown, save, adding, setAdding,
    templates: templatesFor(mode).map((template) => ({ id: template.kind as string, name: t(`homeLayout.kinds.${template.kind}`) })),
    add: (kind: string) => {
      setAdding(false)
      save(addWidget(layout, kind as HomeWidget["kind"]))
    },
    reset: () => save(DEFAULT_LAYOUT),
    move: (index: number, step: -1 | 1) => save(placeWidget(layout, shown[index].id, layout.findIndex((w) => w.id === shown[index + step]?.id))),
    choicesOf: (widget: HomeWidget): Choice[] | undefined => {
      const picks = definitionOf(widget.kind)?.picks
      return picks ? choices[picks] : undefined
    },
  }
}

export type HomeLayoutModel = ReturnType<typeof useHomeLayoutScreen>

/** One card's own state: the name being typed and whether its picker is open. */
export function useCardEditor(model: HomeLayoutModel, widget: HomeWidget) {
  const { t } = useTranslation()
  const { layout, save } = model
  const definition = definitionOf(widget.kind)
  const templateName = t(`homeLayout.kinds.${widget.kind}`)
  const [title, setTitle] = useState(widget.title ?? "")
  const [savedTitle, setSavedTitle] = useState(widget.title ?? "")
  const [picking, setPicking] = useState(false)
  if ((widget.title ?? "") !== savedTitle) {
    setSavedTitle(widget.title ?? "")
    setTitle(widget.title ?? "")
  }
  const choices = model.choicesOf(widget)
  const picked = widget.pick ?? []
  return {
    definition, templateName, title, setTitle, picking, setPicking, choices, picked,
    pickKind: definition?.picks,
    pickedNames: choices?.filter((c) => picked.includes(c.id)).map((c) => c.name).join(", "),
    // Saved when the field is left, not per keystroke, so typing a name is one change to sync.
    commitTitle: () => {
      const next = title.trim().slice(0, MAX_TITLE)
      if (next !== (widget.title ?? "")) save(updateWidget(layout, widget.id, { title: next || null }))
    },
    setSize: (size: string | null) => size && save(updateWidget(layout, widget.id, { size: size as WidgetSize })),
    setOption: (key: string, value: string | null) => value && save(updateWidget(layout, widget.id, { options: { [key]: value } })),
    togglePick: (id: string) => save(updateWidget(layout, widget.id, { pick: picked.includes(id) ? picked.filter((p) => p !== id) : [...picked, id] })),
    remove: () => save(removeWidget(layout, widget.id)),
  }
}

export { MAX_TITLE }
