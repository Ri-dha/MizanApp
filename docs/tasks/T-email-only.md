# T-email-only — Sign up and sign in with an email only
- Status: in-progress (2026-11-21)
- Context: user decision 2026-11-21; Google and Apple sign-in dropped. Server side and the decision: ADR auth-email-1 in Ri-dha/mizan.
- Notes: web register, sign-in, reset and operator fields are `type="email"`; the shared `auth.identifier`
  and `auth.identifierHint` strings now say email, so the phone app's screens pick it up without code
  changes. `normaliseIdentifier` is unchanged on purpose: the key salt depends on it.
