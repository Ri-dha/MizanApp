import { Suspense, type ComponentType, type LazyExoticComponent } from "react"

import { viewFor, type AppStyle } from "@mizan/core/domain/appStyle"
import { usePreferences } from "@/app/preferences"

export function useAppStyle(): AppStyle {
  return usePreferences().appStyle
}

type View<P> = ComponentType<P> | LazyExoticComponent<ComponentType<P>>

/**
 * ADR styles-1: a page keeps its logic in one hook and draws through the chosen template's view.
 * Views are lazy, so a person downloads only their template's layout; a template without its own
 * view for a page gets the Soft one in its own colours.
 */
export function styleViews<P extends object>(views: { soft: View<P> } & Partial<Record<AppStyle, View<P>>>) {
  return function StyleView(props: P) {
    const Chosen = viewFor(views, useAppStyle()) as ComponentType<P>
    return <Suspense fallback={null}><Chosen {...props} /></Suspense>
  }
}
