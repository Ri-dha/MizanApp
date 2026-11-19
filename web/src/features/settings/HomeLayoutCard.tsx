import { ArrowDown, ArrowUp } from "lucide-react"
import { useEffect, useRef } from "react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { useHomeLayout } from "@/features/home/useHomeLayout"
import { DEFAULT_LAYOUT, definitionOf, moveWidget, saveHomeLayout, updateWidget, type HomeWidget, type WidgetSize } from "@mizan/core/db/homeLayout"

const SIZES: WidgetSize[] = ["full", "compact"]
const ANCHOR = "home"

/** ADR home-1: which cards Home shows, in what order, how big, and what each one shows. */
export function HomeLayoutCard() {
  const { t } = useTranslation()
  const layout = useHomeLayout()
  const card = useRef<HTMLDivElement>(null)
  const save = (next: HomeWidget[]) => void saveHomeLayout(next)

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
        {layout.map((widget, index) => {
          const id = `widget-${widget.kind}`
          return (
            <div key={widget.kind} className="flex flex-col gap-3 rounded-lg border p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Switch id={id} checked={widget.visible} onCheckedChange={(visible) => save(updateWidget(layout, widget.kind, { visible }))} />
                  <Label htmlFor={id} className="font-semibold">{t(`homeLayout.kinds.${widget.kind}`)}</Label>
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" aria-label={t("homeLayout.moveUp")} disabled={index === 0} onClick={() => save(moveWidget(layout, widget.kind, -1))}><ArrowUp /></Button>
                  <Button size="icon" variant="ghost" aria-label={t("homeLayout.moveDown")} disabled={index === layout.length - 1} onClick={() => save(moveWidget(layout, widget.kind, 1))}><ArrowDown /></Button>
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
            </div>
          )
        })}
        <Button variant="outline" className="self-start" onClick={() => save(DEFAULT_LAYOUT)}>{t("homeLayout.reset")}</Button>
      </CardContent>
    </Card>
  )
}
