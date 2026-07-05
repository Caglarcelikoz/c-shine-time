import { OCCASION_TAGS, PRIMARY_STYLES } from "@/lib/types"
import type { OccasionTag, PrimaryStyle } from "@/lib/types"
import { OVERREPRESENTED_THRESHOLD, type Coverage, type RuleWatch } from "./types"

/**
 * C1 — Style + occasion coverage. Counts each primaryStyle and occasionTag across
 * the given (owned) watches and reports which styles are missing/overrepresented
 * and which occasion tags have no watch at all.
 */
export function computeCoverage(watches: RuleWatch[]): Coverage {
  const countsByStyle = Object.fromEntries(
    PRIMARY_STYLES.map((s) => [s, 0])
  ) as Record<PrimaryStyle, number>

  const occasionCounts = Object.fromEntries(
    OCCASION_TAGS.map((t) => [t, 0])
  ) as Record<OccasionTag, number>

  for (const w of watches) {
    countsByStyle[w.primaryStyle] += 1
    for (const tag of w.occasionTags) occasionCounts[tag] += 1
  }

  const missingStyles = PRIMARY_STYLES.filter((s) => countsByStyle[s] === 0)

  const overrepresented = PRIMARY_STYLES.filter(
    (s) => countsByStyle[s] >= OVERREPRESENTED_THRESHOLD
  ).map((s) => ({ style: s, count: countsByStyle[s] }))

  const occasionGaps = OCCASION_TAGS.filter((t) => occasionCounts[t] === 0)

  return { countsByStyle, missingStyles, overrepresented, occasionCounts, occasionGaps }
}
