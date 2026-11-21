import { api, unwrap } from "../api/client"
import { rememberFromServer } from "./session"

/** ADR currency-1: the person's country and the currencies they follow, kept on the server for every device. */
export async function updateProfile(changes: { country?: string; trackedCurrencies?: string[] }): Promise<void> {
  await unwrap(api().PATCH("/api/v1/me", { body: changes }))
  await rememberFromServer(null)
}
