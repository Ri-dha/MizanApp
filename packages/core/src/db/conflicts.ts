import { rows, sorted, table } from "../store/store"

/** Edits the server overrode with a newer one (ADR sync-1), newest first, until the person dismisses them. */
export const liveConflicts = () => sorted(rows("conflicts", (c) => !c.dismissed), "detectedAt", "desc")

export const dismissConflict = (id: string) => table("conflicts").update(id, { dismissed: true })
