/** ADR styles-1: the template the app wears. Nothing is stored differently; only layout and colour change. */
export type AppStyle = "mizan" | "clear" | "soft"

export const APP_STYLES: readonly AppStyle[] = ["mizan", "clear", "soft"]

export const DEFAULT_APP_STYLE: AppStyle = "mizan"

export const isAppStyle = (value: unknown): value is AppStyle => value === "mizan" || value === "clear" || value === "soft"

/**
 * The view to draw for a page: the template's own when it has one, otherwise the Soft view, which
 * exists for every page and takes the template's colours.
 */
export function viewFor<V>(views: { soft: V } & Partial<Record<AppStyle, V>>, style: AppStyle): V {
  return views[style] ?? views.soft
}
