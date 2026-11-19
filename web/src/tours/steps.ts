import { TOURS as SHARED, type TourDefinition, type TourStep } from "@mizan/core/tours/tours"

export type { TourDefinition, TourStep } from "@mizan/core/tours/tours"

const selectorOf = (target: string) => (target === "body" ? "body" : `[data-tour="${target}"]`)

/** The shared tours with targets turned into the selectors Joyride looks for. */
export const TOURS: Record<string, TourDefinition> = Object.fromEntries(
  Object.entries(SHARED).map(([id, tour]) => [id, { ...tour, steps: tour.steps.map((s: TourStep) => ({ ...s, target: selectorOf(s.target) })) }]),
)
