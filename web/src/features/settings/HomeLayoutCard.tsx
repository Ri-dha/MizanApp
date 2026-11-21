import { closestCenter, DndContext, KeyboardSensor, PointerSensor, TouchSensor, useSensor, useSensors, type Announcements, type DragEndEvent, type UniqueIdentifier } from "@dnd-kit/core"
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { useLiveQuery } from "dexie-react-hooks"
import { ArrowDown, ArrowUp, ChevronDown, GripVertical, Plus, Trash2 } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { useHomeLayout } from "@/features/home/useHomeLayout"
import { cn } from "@/lib/utils"
import { liveCashAccounts } from "@mizan/core/db/cashAccounts"
import { liveDebts } from "@mizan/core/db/debts"
import { liveGoals } from "@mizan/core/db/goals"
import {
  addWidget, DEFAULT_LAYOUT, definitionOf, moveWidget, placeWidget, removeWidget, saveHomeLayout, shownWidgets, updateWidget, WIDGETS,
  type HomeWidget, type WidgetDefinition, type WidgetSize,
} from "@mizan/core/db/homeLayout"

const SIZES: WidgetSize[] = ["full", "compact"]
const ANCHOR = "home"
const MAX_TITLE = 40

interface Choice {
  id: string
  name: string
}

/** What a cash, goals or debts card can be limited to, from the person's own records. */
function useChoices(): Record<NonNullable<WidgetDefinition["picks"]>, Choice[]> {
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
 * or debts, moved by dragging or with the arrows, and removed.
 */
export function HomeLayoutCard() {
  const { t } = useTranslation()
  const layout = useHomeLayout()
  const card = useRef<HTMLDivElement>(null)
  const choices = useChoices()
  // Shown in the new order at once; the saved layout catches up a moment later.
  const [items, setItems] = useState(layout)
  const [seen, setSeen] = useState(layout)
  if (layout !== seen) {
    setSeen(layout)
    setItems(layout)
  }
  const save = (next: HomeWidget[]) => {
    setItems(next)
    void saveHomeLayout(next)
  }
  const shown = shownWidgets(items)
  // A short move or a held touch starts a drag, so the controls still take a tap and the page still scrolls.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  useEffect(() => {
    if (location.hash === `#${ANCHOR}`) card.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  const nameOf = (id: UniqueIdentifier) => {
    const widget = items.find((w) => w.id === id)
    return widget ? widget.title || t(`homeLayout.kinds.${widget.kind}`) : String(id)
  }
  const position = (id: UniqueIdentifier | undefined) => shown.findIndex((w) => w.id === id) + 1
  const announcements: Announcements = {
    onDragStart: ({ active }) => t("homeLayout.announce.picked", { card: nameOf(active.id), position: position(active.id), count: shown.length }),
    onDragOver: ({ active, over }) => (over ? t("homeLayout.announce.over", { card: nameOf(active.id), position: position(over.id) }) : undefined),
    onDragEnd: ({ active, over }) => (over ? t("homeLayout.announce.dropped", { card: nameOf(active.id), position: position(over.id) }) : undefined),
    onDragCancel: ({ active }) => t("homeLayout.announce.cancelled", { card: nameOf(active.id) }),
  }

  function dropped({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return
    save(placeWidget(items, String(active.id), items.findIndex((w) => w.id === over.id)))
  }

  return (
    <Card id={ANCHOR} ref={card}>
      <CardHeader>
        <CardTitle>{t("homeLayout.title")}</CardTitle>
        <CardDescription>{t("homeLayout.body")}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {shown.length === 0 && <p className="text-sm opacity-70">{t("homeLayout.empty")}</p>}
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={dropped}
          accessibility={{ screenReaderInstructions: { draggable: t("homeLayout.dragInstructions") }, announcements }}>
          <SortableContext items={shown.map((w) => w.id)} strategy={verticalListSortingStrategy}>
            <ul className="flex flex-col gap-3" aria-label={t("homeLayout.title")}>
              {shown.map((widget, index) => (
                <WidgetRow key={widget.id} widget={widget} index={index} count={shown.length} layout={items} save={save}
                  choices={definitionOf(widget.kind)?.picks ? choices[definitionOf(widget.kind)!.picks!] : undefined} />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
        <div className="flex flex-wrap gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline"><Plus /> {t("homeLayout.add")}</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuLabel>{t("homeLayout.templates")}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {WIDGETS.map((template) => (
                <DropdownMenuItem key={template.kind} onSelect={() => save(addWidget(items, template.kind))}>
                  {t(`homeLayout.kinds.${template.kind}`)}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="ghost" onClick={() => save(DEFAULT_LAYOUT)}>{t("homeLayout.reset")}</Button>
        </div>
      </CardContent>
    </Card>
  )
}

/** One card: dragged by its handle, renamed in place, limited to some records where its template allows. */
function WidgetRow({ widget, index, count, layout, save, choices }: {
  widget: HomeWidget
  index: number
  count: number
  layout: HomeWidget[]
  save: (next: HomeWidget[]) => void
  choices: Choice[] | undefined
}) {
  const { t } = useTranslation()
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: widget.id })
  const templateName = t(`homeLayout.kinds.${widget.kind}`)
  const [title, setTitle] = useState(widget.title ?? "")
  const [savedTitle, setSavedTitle] = useState(widget.title ?? "")
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
  const togglePick = (id: string, on: boolean) => {
    const next = on ? [...picked, id] : picked.filter((p) => p !== id)
    save(updateWidget(layout, widget.id, { pick: next }))
  }
  const pickKind = definitionOf(widget.kind)?.picks

  return (
    <li ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn("flex flex-col gap-3 rounded-lg border bg-card p-3", isDragging && "relative z-10 shadow-lg ring-2 ring-primary")}>
      <div className="flex items-center gap-2">
        <button type="button" ref={setActivatorNodeRef} {...attributes} {...listeners}
          className="cursor-grab touch-none rounded p-1 text-muted-foreground hover:bg-muted active:cursor-grabbing"
          aria-label={t("homeLayout.drag", { card: widget.title || templateName })}>
          <GripVertical className="size-4" />
        </button>
        <Input value={title} placeholder={templateName} maxLength={MAX_TITLE} aria-label={t("homeLayout.cardName", { card: templateName })}
          className="h-8 min-w-0 flex-1 font-semibold" onChange={(e) => setTitle(e.target.value)} onBlur={commitTitle}
          onKeyDown={(e) => e.key === "Enter" && (e.currentTarget as HTMLInputElement).blur()} />
        <div className="flex shrink-0 gap-1">
          <Button size="icon" variant="ghost" aria-label={t("homeLayout.moveUp")} disabled={index === 0} onClick={() => save(moveWidget(layout, widget.id, -1))}><ArrowUp /></Button>
          <Button size="icon" variant="ghost" aria-label={t("homeLayout.moveDown")} disabled={index === count - 1} onClick={() => save(moveWidget(layout, widget.id, 1))}><ArrowDown /></Button>
          <Button size="icon" variant="ghost" aria-label={t("homeLayout.remove", { card: widget.title || templateName })} onClick={() => save(removeWidget(layout, widget.id))}><Trash2 /></Button>
        </div>
      </div>
      {widget.title && <span className="-mt-2 ps-8 text-xs text-muted-foreground">{templateName}</span>}
      <div className="flex flex-wrap items-end gap-4 ps-8">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">{t("homeLayout.size")}</span>
          <ToggleGroup type="single" variant="outline" size="sm" value={widget.size} onValueChange={(size) => size && save(updateWidget(layout, widget.id, { size: size as WidgetSize }))}>
            {SIZES.map((size) => <ToggleGroupItem key={size} value={size}>{t(`homeLayout.sizes.${size}`)}</ToggleGroupItem>)}
          </ToggleGroup>
        </div>
        {definitionOf(widget.kind)?.options.map((option) => (
          <div key={option.key} className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">{t(`homeLayout.options.${option.key}.label`)}</span>
            <Select value={widget.options[option.key]} onValueChange={(value) => save(updateWidget(layout, widget.id, { options: { [option.key]: value } }))}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                {option.values.map((value) => <SelectItem key={value} value={value}>{t(`homeLayout.options.${option.key}.values.${value}`)}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        ))}
        {pickKind && choices && (
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">{t(`homeLayout.picks.${pickKind}.label`)}</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="w-48 justify-between font-normal" disabled={choices.length === 0}>
                  <span className="truncate">
                    {picked.length === 0 ? t(`homeLayout.picks.${pickKind}.all`) : choices.filter((c) => picked.includes(c.id)).map((c) => c.name).join(", ") || t(`homeLayout.picks.${pickKind}.all`)}
                  </span>
                  <ChevronDown className="opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="max-h-80 overflow-y-auto">
                <DropdownMenuLabel className="text-xs font-normal opacity-70">{t("homeLayout.pickHint")}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {choices.map((choice) => (
                  <DropdownMenuCheckboxItem key={choice.id} checked={picked.includes(choice.id)}
                    onSelect={(e) => e.preventDefault()} onCheckedChange={(on) => togglePick(choice.id, on === true)}>
                    {choice.name}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </li>
  )
}
