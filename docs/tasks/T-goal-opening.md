# T-goal-opening — Money already saved toward a goal
- Status: done (2026-11-21, 3a5f4ef on develop and main)
- Context: user request 2026-11-21 ("where do we add savings we already have?"). Deposits come from a plan bucket, so
  savings from before the goal had no honest place.
- Notes: optional `Goal.openingAmount` (goal currency, sealed like every field); `savedOf` starts from it; create and
  update settle COMPLETED/ACTIVE. Web GoalSheet field "Already saved" (hidden for asset-backed goals) and a card note;
  phone goal editor and list the same. Server: `GoalSyncTable` accepts the field (Ri-dha/mizan). Not converted on a base
  change: it is in the goal's own currency.
