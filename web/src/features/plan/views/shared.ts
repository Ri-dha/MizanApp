import type { BucketInput } from "@mizan/core/db/plan"
import type { PlanPageModel } from "../usePlanPage"

/** A fixed amount replaces the share, so turning it on clears the share and turning it off keeps it. */
export const toggleFixed = (model: PlanPageModel, index: number, bucket: BucketInput) => (on: boolean) =>
  model.update(index, { fixedAmount: on ? 0 : null, shareBasisPoints: on ? 0 : bucket.shareBasisPoints })

/** DESIGN.md: a disabled main action is muted with a dashed border, never a pale tint of the primary. */
export const disabledSave = "disabled:border disabled:border-dashed disabled:border-input disabled:bg-muted disabled:text-muted-foreground disabled:opacity-100"
