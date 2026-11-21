import { useSyncExternalStore } from "react"

import { preferences, setPreferences } from "@/app/preferences"
import { TOURS, type TourDefinition } from "./steps"

let active: TourDefinition | null = null
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((l) => l())
}

/** An open dialog makes the rest of the page ignore clicks, the tour's Skip and Next included. */
const OPEN_DIALOG = '[role="dialog"][data-state="open"], [role="alertdialog"][data-state="open"]'

let waiting: MutationObserver | null = null

export function dialogOpen(): boolean {
  return typeof document !== "undefined" && document.querySelector(OPEN_DIALOG) !== null
}

/** For the tour to step aside while a dialog opened after it started is showing. */
export function subscribeDialogs(listener: () => void): () => void {
  const observer = new MutationObserver(listener)
  observer.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ["data-state"] })
  return () => observer.disconnect()
}

/**
 * Shows a tour, but only once no dialog is open: a tour over a dialog (the recovery code after
 * sign-up, say) could not be skipped, and its clicks landed on the dialog underneath.
 */
export function startTour(id: string) {
  const tour = TOURS[id]
  if (!tour) return
  waiting?.disconnect()
  waiting = null
  const show = () => {
    active = tour
    emit()
  }
  if (!dialogOpen()) return show()
  const observer = new MutationObserver(() => {
    if (document.querySelector(OPEN_DIALOG)) return
    observer.disconnect()
    if (waiting === observer) waiting = null
    show()
  })
  waiting = observer
  observer.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ["data-state"] })
}

/** A screen left before its tour could start takes the waiting tour with it. */
export function cancelWaitingTour() {
  waiting?.disconnect()
  waiting = null
}

export function endTour() {
  if (active) markSeen(active.id)
  active = null
  emit()
}

export function useActiveTour(): TourDefinition | null {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => active,
  )
}

export function hasSeen(id: string): boolean {
  return preferences().toursSeen.includes(id)
}

export function markSeen(id: string) {
  const seen = preferences().toursSeen
  if (!seen.includes(id)) setPreferences({ toursSeen: [...seen, id] })
}

export function forgetAllTours() {
  setPreferences({ toursSeen: [] })
}
