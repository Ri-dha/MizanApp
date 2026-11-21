import { rows } from "../store/store"
import type { HomeLayout, HomeWidget, WidgetKind, WidgetSize } from "../schema"
import { isAppMode, shows, type AdvancedArea, type AppMode } from "../domain/appMode"
import type { DigitStyle } from "../domain/digits"
import { writeFields } from "./write"

export type { HomeWidget, WidgetKind, WidgetSize } from "../schema"

/** A card's setting and the values it may take; the first value is the default. */
export interface WidgetOption {
  key: string
  values: readonly string[]
}

export interface WidgetDefinition {
  kind: WidgetKind
  /** Shown on a new account; the others wait in the list to be added. */
  shownByDefault: boolean
  options: readonly WidgetOption[]
  /** What a card of this kind can be limited to (T-home-templates). */
  picks?: "accounts" | "goals" | "debts"
  /** Set for cards simple mode leaves out (ADR mode-1). */
  area?: AdvancedArea
}

/** ADR home-1: every template Home can make a card from, in the order a new account sees them. */
export const WIDGETS: readonly WidgetDefinition[] = [
  { kind: "netWorth", shownByDefault: true, options: [{ key: "breakdown", values: ["totals", "classes"] }] },
  { kind: "month", shownByDefault: true, options: [] },
  { kind: "dollar", shownByDefault: true, options: [] },
  { kind: "plan", shownByDefault: true, options: [{ key: "figure", values: ["free", "spent", "allocated"] }], area: "plan" },
  { kind: "metals", shownByDefault: true, options: [{ key: "show", values: ["gain", "value"] }], area: "metals" },
  { kind: "bills", shownByDefault: true, options: [{ key: "count", values: ["5", "3", "10"] }], area: "bills" },
  { kind: "cash", shownByDefault: true, options: [{ key: "currency", values: ["all", "IQD", "USD"] }], picks: "accounts" },
  { kind: "goals", shownByDefault: false, options: [{ key: "count", values: ["3", "5"] }], picks: "goals", area: "goals" },
  { kind: "debts", shownByDefault: false, options: [{ key: "direction", values: ["OWING", "OWED"] }], picks: "debts" },
]

const SIZES: readonly WidgetSize[] = ["full", "compact"]
export const MAX_TITLE = 40
const MAX_PICKS = 50

export const definitionOf = (kind: WidgetKind): WidgetDefinition | undefined => WIDGETS.find((w) => w.kind === kind)

/** The templates and cards a mode shows; the stored layout keeps the others for when the person switches back. */
export const templatesFor = (mode: AppMode): WidgetDefinition[] => WIDGETS.filter((w) => shows(mode, w.area))
export const widgetsFor = (mode: AppMode, widgets: HomeWidget[]): HomeWidget[] => widgets.filter((w) => shows(mode, definitionOf(w.kind)?.area))

function freshWidget(definition: WidgetDefinition, id: string = definition.kind): HomeWidget {
  return {
    id,
    kind: definition.kind,
    visible: definition.shownByDefault,
    size: "full",
    options: Object.fromEntries(definition.options.map((o) => [o.key, o.values[0]])),
  }
}

export const DEFAULT_LAYOUT: HomeWidget[] = WIDGETS.map((w) => freshWidget(w))

/**
 * A stored layout as Home should draw it: unknown kinds and values (from a newer app, or an
 * older one) are dropped or reset, and templates added since the layout was saved join at the
 * end, hidden, so an old device never breaks a layout a new one wrote. Cards from before cards
 * could repeat take their kind as their id.
 */
export function normaliseLayout(stored: readonly HomeWidget[] | undefined): HomeWidget[] {
  if (!stored) return DEFAULT_LAYOUT
  const seenIds = new Set<string>()
  const seenKinds = new Set<WidgetKind>()
  const kept: HomeWidget[] = []
  for (const widget of stored) {
    const definition = definitionOf(widget.kind)
    const id = typeof widget.id === "string" && widget.id ? widget.id : widget.kind
    if (!definition || seenIds.has(id)) continue
    seenIds.add(id)
    seenKinds.add(widget.kind)
    const fresh = freshWidget(definition, id)
    const title = typeof widget.title === "string" ? widget.title.trim().slice(0, MAX_TITLE) : ""
    const pick = definition.picks && Array.isArray(widget.pick) ? widget.pick.filter((p) => typeof p === "string").slice(0, MAX_PICKS) : []
    kept.push({
      id,
      kind: widget.kind,
      visible: widget.visible === true,
      size: SIZES.includes(widget.size) ? widget.size : fresh.size,
      options: Object.fromEntries(definition.options.map((o) => [o.key, o.values.includes(widget.options?.[o.key]) ? widget.options[o.key] : o.values[0]])),
      ...(title ? { title } : {}),
      ...(pick.length > 0 ? { pick } : {}),
    })
  }
  const added = WIDGETS.filter((w) => !seenKinds.has(w.kind)).map((w) => ({ ...freshWidget(w), visible: false }))
  return [...kept, ...added]
}

export function moveWidget(widgets: HomeWidget[], id: string, step: -1 | 1): HomeWidget[] {
  const shown = widgets.filter((w) => w.visible)
  const at = shown.findIndex((w) => w.id === id)
  const neighbour = shown[at + step]
  if (at < 0 || !neighbour) return widgets
  return placeWidget(widgets, id, widgets.findIndex((w) => w.id === neighbour.id))
}

/** Drag and drop: the card is taken out and put back at the index it was dropped on. */
export function placeWidget(widgets: HomeWidget[], id: string, to: number): HomeWidget[] {
  const from = widgets.findIndex((w) => w.id === id)
  if (from < 0 || to < 0 || to >= widgets.length || from === to) return widgets
  const next = [...widgets]
  const [moved] = next.splice(from, 1)
  next.splice(to, 0, moved)
  return next
}

export function updateWidget(
  widgets: HomeWidget[], id: string,
  change: Partial<Omit<HomeWidget, "id" | "kind" | "options">> & { options?: Record<string, string> },
): HomeWidget[] {
  return widgets.map((w) => (w.id === id ? { ...w, ...change, options: { ...w.options, ...change.options } } : w))
}

/** A new card from a template, at the end of Home. */
export function addWidget(widgets: HomeWidget[], kind: WidgetKind, id: string = crypto.randomUUID()): HomeWidget[] {
  const definition = definitionOf(kind)
  if (!definition) return widgets
  return [...widgets, { ...freshWidget(definition, id), visible: true }]
}

/**
 * Takes a card off Home. The last card of a kind stays in the layout, hidden, because an app
 * from before cards could repeat expects one of each kind.
 */
export function removeWidget(widgets: HomeWidget[], id: string): HomeWidget[] {
  const card = widgets.find((w) => w.id === id)
  if (!card) return widgets
  const others = widgets.some((w) => w.id !== id && w.kind === card.kind)
  return others ? widgets.filter((w) => w.id !== id) : updateWidget(widgets, id, { visible: false })
}

/** The cards Home draws, in order. */
export const shownWidgets = (widgets: HomeWidget[]): HomeWidget[] => widgets.filter((w) => w.visible)

/** What a card shows of a picked list: everything when nothing is picked. */
export function pickedFrom<T extends { id: string }>(widget: HomeWidget, items: T[]): T[] {
  return widget.pick && widget.pick.length > 0 ? items.filter((item) => widget.pick!.includes(item.id)) : items
}

export const liveHomeLayoutRow = () => rows("homeLayouts", (l) => l.deletedAt === null).then((found) => found[0])

export async function liveHomeLayout(): Promise<HomeWidget[]> {
  return normaliseLayout((await liveHomeLayoutRow())?.widgets)
}

async function writeLayoutRow(change: Partial<HomeLayout>) {
  const existing = await liveHomeLayoutRow()
  await writeFields<HomeLayout>("home_layout", existing?.id ?? crypto.randomUUID(), { ...(existing ? {} : { visibility: "PRIVATE" as const }), ...change })
}

export async function saveHomeLayout(widgets: HomeWidget[]) {
  await writeLayoutRow({ widgets })
}

/** ADR home-2: the reading preferences that follow a person; language, theme and display currency stay per device. */
export interface SyncedPreferences {
  digitStyle: DigitStyle
  showUsd: boolean
  showHijri: boolean
  valuationReminderMonths: number
  /** ADR mode-1. */
  appMode: AppMode
}

export const SYNCED_KEYS = ["digitStyle", "showUsd", "showHijri", "valuationReminderMonths", "appMode"] as const satisfies readonly (keyof SyncedPreferences)[]

const MAX_REMINDER_MONTHS = 120

/** The values on the row this app understands; anything missing or out of range is left to the device. */
export function syncedPreferencesOf(row: HomeLayout | undefined): Partial<SyncedPreferences> {
  if (!row) return {}
  const found: Partial<SyncedPreferences> = {}
  if (row.digitStyle === "western" || row.digitStyle === "eastern") found.digitStyle = row.digitStyle
  if (typeof row.showUsd === "boolean") found.showUsd = row.showUsd
  if (typeof row.showHijri === "boolean") found.showHijri = row.showHijri
  const months = row.valuationReminderMonths
  if (typeof months === "number" && Number.isInteger(months) && months >= 1 && months <= MAX_REMINDER_MONTHS) found.valuationReminderMonths = months
  if (isAppMode(row.appMode)) found.appMode = row.appMode
  return found
}

export const liveSyncedPreferences = () => liveHomeLayoutRow().then(syncedPreferencesOf)

export function pickSynced(change: Partial<SyncedPreferences> & Record<string, unknown>): Partial<SyncedPreferences> {
  return Object.fromEntries(SYNCED_KEYS.filter((k) => k in change).map((k) => [k, change[k]])) as Partial<SyncedPreferences>
}

export async function saveSyncedPreferences(change: Partial<SyncedPreferences>) {
  const picked = pickSynced(change)
  if (Object.keys(picked).length > 0) await writeLayoutRow(picked)
}

/**
 * What a device does with the row's preferences: take every value the row holds, and when the
 * row holds none yet (after this device has synced once, so another device's values had their
 * chance to arrive) seed it with this device's own choices rather than resetting them.
 */
export function reconcileSynced(found: Partial<SyncedPreferences>, local: SyncedPreferences, defaults: SyncedPreferences, hasSynced: boolean): { apply: Partial<SyncedPreferences>; seed: Partial<SyncedPreferences> } {
  const differs = (source: Partial<SyncedPreferences>, against: SyncedPreferences) =>
    Object.fromEntries(SYNCED_KEYS.filter((k) => source[k] !== undefined && source[k] !== against[k]).map((k) => [k, source[k]])) as Partial<SyncedPreferences>
  if (Object.keys(found).length > 0) return { apply: differs(found, local), seed: {} }
  return { apply: {}, seed: hasSynced ? differs(local, defaults) : {} }
}
