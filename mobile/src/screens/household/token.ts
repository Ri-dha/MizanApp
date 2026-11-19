/** A pasted invitation link or a bare token: the token is always the last path segment. */
export function invitationToken(input: string): string {
  return input.trim().replace(/\/+$/, "").split("/").pop() ?? ""
}
