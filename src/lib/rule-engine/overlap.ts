import { sameOverlapProfile } from "./shared"
import type { OverlapResult, RuleWatch } from "./types"

/**
 * C2 — Overlap detection. For every watch, lists the ids of other watches it
 * overlaps with (same primaryStyle + colorFamily + caseSizeBand). Watches with
 * no overlaps get an empty array.
 */
export function detectOverlaps(watches: RuleWatch[]): OverlapResult[] {
  return watches.map((w) => ({
    watchId: w.id,
    overlapsWith: watches
      .filter((other) => other.id !== w.id && sameOverlapProfile(w, other))
      .map((other) => other.id),
  }))
}
