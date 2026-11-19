import { rows } from "../store/store"
import type { HomeLayout, HomeWidget, WidgetKind, WidgetSize } from "../schema"
import { writeFields } from "./write"

export type { HomeWidget, WidgetKind, WidgetSize } from "../schema"

/** A card's setting and the values it may take; the first value is the default. */
export interface WidgetOption {
  key: string
  values: readonly string[]
}

export interface WidgetDefinition {
  kind: WidgetKind
  /** Shown on a new account; the others wait in the list to be switched on. */
  shownByDefault: boolean
  options: readonly WidgetOption[]
}

/** ADR home-1: every card Home can show, in the order a new account sees them. */
export const WIDGETS: readonly WidgetDefinition[] = [
  { kind: "netWorth", shownByDefault: true, options: [{ key: "breakdown", values: ["totals", "classes"] }] },
  { kind: "dollar", shownByDefault: true, options: [] },
  { kind: "plan", shownByDefault: true, options: [{ key: "figure", values: ["free", "spent", "allocated"] }] },
  { kind: "metals", shownByDefault: true, options: [{ key: "show", values: ["gain", "value"] }] },
  { kind: "bills", shownByDefault: true, options: [{ key: "count", values: ["5", "3", "10"] }] },
  { kind: "cash", shownByDefault: true, options: [{ key: "currency", values: ["all", "IQD", "USD"] }] },
  { kind: "goals", shownByDefault: false, options: [{ key: "count", values: ["3", "5"] }] },
  { kind: "debts", shownByDefault: false, options: [{ key: "direction", values: ["OWING", "OWED"] }] },
]

const SIZES: readonly WidgetSize[] = ["full", "compact"]

export const definitionOf = (kind: WidgetKind): WidgetDefinition | undefined => WIDGETS.find((w) => w.kind === kind)

function freshWidget(definition: WidgetDefinition): HomeWidget {
  return {
    kind: definition.kind,
    visible: definition.shownByDefault,
    size: "full",
    options: Object.fromEntries(definition.options.map((o) => [o.key, o.values[0]])),
  }
}

export const DEFAULT_LAYOUT: HomeWidget[] = WIDGETS.map(freshWidget)

/**
 * A stored layout as Home should draw it: unknown kinds and values (from a newer app, or an
 * older one) are dropped or reset, and cards added since the layout was saved join at the end,
 * so an old device never breaks a layout a new one wrote.
 */
export function normaliseLayout(stored: readonly HomeWidget[] | undefined): HomeWidget[] {
  if (!stored) return DEFAULT_LAYOUT
  const seen = new Set<WidgetKind>()
  const kept: HomeWidget[] = []
  for (const widget of stored) {
    const definition = definitionOf(widget.kind)
    if (!definition || seen.has(widget.kind)) continue
    seen.add(widget.kind)
    const fresh = freshWidget(definition)
    kept.push({
      kind: widget.kind,
      visible: widget.visible === true,
      size: SIZES.includes(widget.size) ? widget.size : fresh.size,
      options: Object.fromEntries(definition.options.map((o) => [o.key, o.values.includes(widget.options?.[o.key]) ? widget.options[o.key] : o.values[0]])),
    })
  }
  const added = WIDGETS.filter((w) => !seen.has(w.kind)).map((w) => ({ ...freshWidget(w), visible: false }))
  return [...kept, ...added]
}

export const liveHomeLayoutRow = () => rows("homeLayouts", (l) => l.deletedAt === null).then((found) => found[0])

export async function liveHomeLayout(): Promise<HomeWidget[]> {
  return normaliseLayout((await liveHomeLayoutRow())?.widgets)
}

export async function saveHomeLayout(widgets: HomeWidget[]) {
  const existing = await liveHomeLayoutRow()
  await writeFields<HomeLayout>("home_layout", existing?.id ?? crypto.randomUUID(), { ...(existing ? {} : { visibility: "PRIVATE" as const }), widgets })
}

export function moveWidget(widgets: HomeWidget[], kind: WidgetKind, step: -1 | 1): HomeWidget[] {
  const from = widgets.findIndex((w) => w.kind === kind)
  const to = from + step
  if (from < 0 || to < 0 || to >= widgets.length) return widgets
  const next = [...widgets]
  ;[next[from], next[to]] = [next[to], next[from]]
  return next
}

export function updateWidget(widgets: HomeWidget[], kind: WidgetKind, change: Partial<Omit<HomeWidget, "kind" | "options">> & { options?: Record<string, string> }): HomeWidget[] {
  return widgets.map((w) => (w.kind === kind ? { ...w, ...change, options: { ...w.options, ...change.options } } : w))
}
