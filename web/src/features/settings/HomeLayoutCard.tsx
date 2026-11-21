import { closestCenter, DndContext, KeyboardSensor, PointerSensor, TouchSensor, useSensor, useSensors, type Announcements, type DragEndEvent, type UniqueIdentifier } from "@dnd-kit/core"
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { ArrowDown, ArrowUp, GripVertical } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { useHomeLayout } from "@/features/home/useHomeLayout"
import { DEFAULT_LAYOUT, definitionOf, moveWidget, placeWidget, saveHomeLayout, updateWidget, type HomeWidget, type WidgetSize } from "@mizan/core/db/homeLayout"
import type { WidgetKind } from "@mizan/core/schema"
import { cn } from "@/lib/utils"

const SIZES: WidgetSize[] = ["full", "compact"]
const ANCHOR = "home"

/** ADR home-1: which cards Home shows, in what order, how big, and what each one shows. */
export function HomeLayoutCard() {
  const { t } = useTranslation()
  const layout = useHomeLayout()
  const card = useRef<HTMLDivElement>(null)
  // Shown in the dropped order at once; the saved layout catches up a moment later.
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
  // A short move or a held touch starts a drag, so the switches still take a tap and the page still scrolls.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const name = (id: UniqueIdentifier) => t(`homeLayout.kinds.${String(id)}`)
  const position = (id: UniqueIdentifier | undefined) => items.findIndex((w) => w.kind === id) + 1
  const announcements: Announcements = {
    onDragStart: ({ active }) => t("homeLayout.announce.picked", { card: name(active.id), position: position(active.id), count: items.length }),
    onDragOver: ({ active, over }) => (over ? t("homeLayout.announce.over", { card: name(active.id), position: position(over.id) }) : undefined),
    onDragEnd: ({ active, over }) => (over ? t("homeLayout.announce.dropped", { card: name(active.id), position: position(over.id) }) : undefined),
    onDragCancel: ({ active }) => t("homeLayout.announce.cancelled", { card: name(active.id) }),
  }

  function dropped({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return
    save(placeWidget(items, active.id as WidgetKind, items.findIndex((w) => w.kind === over.id)))
  }

  useEffect(() => {
    if (location.hash === `#${ANCHOR}`) card.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  return (
    <Card id={ANCHOR} ref={card}>
      <CardHeader>
        <CardTitle>{t("homeLayout.title")}</CardTitle>
        <CardDescription>{t("homeLayout.body")}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={dropped}
          accessibility={{ screenReaderInstructions: { draggable: t("homeLayout.dragInstructions") }, announcements }}>
          <SortableContext items={items.map((w) => w.kind)} strategy={verticalListSortingStrategy}>
            <ul className="flex flex-col gap-3" aria-label={t("homeLayout.title")}>
              {items.map((widget, index) => (
                <WidgetRow key={widget.kind} widget={widget} index={index} count={items.length} layout={items} save={save} />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
        <Button variant="outline" className="self-start" onClick={() => save(DEFAULT_LAYOUT)}>{t("homeLayout.reset")}</Button>
      </CardContent>
    </Card>
  )
}

/** One card's row: dragged by its handle, or moved with the arrows. */
function WidgetRow({ widget, index, count, layout, save }: { widget: HomeWidget; index: number; count: number; layout: HomeWidget[]; save: (next: HomeWidget[]) => void }) {
  const { t } = useTranslation()
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: widget.kind })
  const id = `widget-${widget.kind}`
  return (
    <li ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn("flex flex-col gap-3 rounded-lg border bg-card p-3", isDragging && "relative z-10 shadow-lg ring-2 ring-primary")}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button type="button" ref={setActivatorNodeRef} {...attributes} {...listeners}
            className="cursor-grab touch-none rounded p-1 text-muted-foreground hover:bg-muted active:cursor-grabbing"
            aria-label={t("homeLayout.drag", { card: t(`homeLayout.kinds.${widget.kind}`) })}>
            <GripVertical className="size-4" />
          </button>
          <Switch id={id} checked={widget.visible} onCheckedChange={(visible) => save(updateWidget(layout, widget.kind, { visible }))} />
          <Label htmlFor={id} className="font-semibold">{t(`homeLayout.kinds.${widget.kind}`)}</Label>
        </div>
        <div className="flex gap-1">
          <Button size="icon" variant="ghost" aria-label={t("homeLayout.moveUp")} disabled={index === 0} onClick={() => save(moveWidget(layout, widget.kind, -1))}><ArrowUp /></Button>
          <Button size="icon" variant="ghost" aria-label={t("homeLayout.moveDown")} disabled={index === count - 1} onClick={() => save(moveWidget(layout, widget.kind, 1))}><ArrowDown /></Button>
        </div>
      </div>
      {widget.visible && (
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">{t("homeLayout.size")}</span>
            <ToggleGroup type="single" variant="outline" size="sm" value={widget.size} onValueChange={(size) => size && save(updateWidget(layout, widget.kind, { size: size as WidgetSize }))}>
              {SIZES.map((size) => <ToggleGroupItem key={size} value={size}>{t(`homeLayout.sizes.${size}`)}</ToggleGroupItem>)}
            </ToggleGroup>
          </div>
          {definitionOf(widget.kind)?.options.map((option) => (
            <div key={option.key} className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">{t(`homeLayout.options.${option.key}.label`)}</span>
              <Select value={widget.options[option.key]} onValueChange={(value) => save(updateWidget(layout, widget.kind, { options: { [option.key]: value } }))}>
                <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {option.values.map((value) => <SelectItem key={value} value={value}>{t(`homeLayout.options.${option.key}.values.${value}`)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
      )}
    </li>
  )
}
