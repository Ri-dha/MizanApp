/** ADR sync-4: what the wait loop needs, so it can be tested without a server. */
export interface WatchDeps {
  /** The device's pull cursor; undefined when signed out or never synced, which ends the loop. */
  since(): Promise<number | undefined>
  /** Held by the server until the household's feed moves past `since` or the wait times out. */
  wait(since: number): Promise<boolean>
  /** Runs a sync; afterwards the cursor should have moved. */
  changed(): Promise<void>
  /** On screen and online: waiting in the background would only hold a connection. */
  active(): boolean
  sleep(ms: number): Promise<void>
}

const FIRST_RETRY_MS = 5_000
const LONGEST_RETRY_MS = 60_000

/**
 * Asks the server to hold a request until something changes, syncs, and asks again. Errors back off
 * up to a minute. A "changed" that a sync does not catch up with also backs off, so a cursor that
 * cannot move (keys still missing, say) never turns the loop into a busy one.
 */
export async function watchForChanges(deps: WatchDeps): Promise<void> {
  let retry = FIRST_RETRY_MS
  while (deps.active()) {
    const since = await deps.since()
    if (since === undefined) return
    try {
      if (!(await deps.wait(since))) {
        retry = FIRST_RETRY_MS
        continue
      }
      await deps.changed()
      if ((await deps.since()) !== since) {
        retry = FIRST_RETRY_MS
        continue
      }
    } catch {
      // Offline, signed out or the server restarting: try again later.
    }
    await deps.sleep(retry)
    retry = Math.min(retry * 2, LONGEST_RETRY_MS)
  }
}
