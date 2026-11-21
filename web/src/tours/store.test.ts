import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { act, renderHook } from "@testing-library/react"

import { cancelWaitingTour, endTour, startTour, useActiveTour } from "./store"

const settle = () => new Promise((resolve) => setTimeout(resolve, 0))

/** Regression: a tour shown over the recovery-code dialog could not be skipped (the dialog takes every click). */
describe("a tour waits for open dialogs", () => {
  let dialog: HTMLDivElement

  beforeEach(() => {
    dialog = document.createElement("div")
    dialog.setAttribute("role", "dialog")
    dialog.dataset.state = "open"
    document.body.append(dialog)
  })

  afterEach(() => {
    cancelWaitingTour()
    act(() => endTour())
    dialog.remove()
  })

  it("starts only after the dialog closes", async () => {
    const { result } = renderHook(() => useActiveTour())
    act(() => startTour("welcome"))
    expect(result.current).toBeNull()

    await act(async () => {
      dialog.dataset.state = "closed"
      await settle()
    })
    expect(result.current?.id).toBe("welcome")
  })

  it("starts at once when no dialog is open", () => {
    dialog.remove()
    const { result } = renderHook(() => useActiveTour())
    act(() => startTour("welcome"))
    expect(result.current?.id).toBe("welcome")
  })

  it("drops a waiting tour when its screen is left", async () => {
    const { result } = renderHook(() => useActiveTour())
    act(() => startTour("welcome"))
    cancelWaitingTour()
    await act(async () => {
      dialog.remove()
      await settle()
    })
    expect(result.current).toBeNull()
  })
})
