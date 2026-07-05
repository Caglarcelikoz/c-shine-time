import { computeCoverage } from "./coverage"
import { clamp, sameOverlapProfile } from "./shared"
import { OVERREPRESENTED_THRESHOLD } from "./types"
import type { BudgetRange, CandidateWatch, RuleWatch } from "./types"

/**
 * C4 — Fit score (0-100), fully deterministic (no LLM). Rewards filling a
 * missing style / occasion gap, penalizes overlap with owned pieces, and nudges
 * for budget fit. Same input always yields the same output.
 *
 * Components, starting from a base of 50:
 *  - style:    missing +30 · one owned +10 · two owned −5 · overrepresented −20
 *  - occasion: +up to 20 for the share of the candidate's tags that fill a gap
 *  - overlap:  −15 per overlapping owned watch (capped at −30)
 *  - budget:   within range +15 · above max −15 · else 0
 */
export function computeFitScore(
  candidate: CandidateWatch,
  owned: RuleWatch[],
  budget?: BudgetRange
): number {
  const cov = computeCoverage(owned)
  let score = 50

  // Style gap component
  const styleCount = cov.countsByStyle[candidate.primaryStyle] ?? 0
  if (styleCount === 0) score += 30
  else if (styleCount === 1) score += 10
  else if (styleCount === 2) score -= 5
  else if (styleCount >= OVERREPRESENTED_THRESHOLD) score -= 20

  // Occasion gap component
  if (candidate.occasionTags.length > 0) {
    const filled = candidate.occasionTags.filter((t) =>
      cov.occasionGaps.includes(t)
    ).length
    score += Math.round((filled / candidate.occasionTags.length) * 20)
  }

  // Overlap penalty
  const overlaps = owned.filter((o) => sameOverlapProfile(candidate, o)).length
  score -= Math.min(overlaps * 15, 30)

  // Budget component
  const hasBudget = budget && (budget.min != null || budget.max != null)
  if (hasBudget && candidate.price != null) {
    const aboveMax = budget.max != null && candidate.price > budget.max
    const belowMin = budget.min != null && candidate.price < budget.min
    if (aboveMax) score -= 15
    else if (!belowMin) score += 15
  }

  return clamp(Math.round(score), 0, 100)
}
