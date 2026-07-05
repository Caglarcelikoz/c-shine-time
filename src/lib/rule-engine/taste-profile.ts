import { OCCASION_TAGS, PRIMARY_STYLES } from "@/lib/types"
import type { OccasionTag, PrimaryStyle } from "@/lib/types"
import { OCCASION_TAG_LABELS, PRIMARY_STYLE_LABELS } from "@/lib/labels"
import type { RuleWatch, TagScore } from "./types"

/**
 * C3 — Taste-profile tagScores. Counts each style/occasion across owned watches
 * and normalizes to 0-100 *within each group* (styles vs occasions), so the most
 * common style and the most common occasion each reach 100. More divers → higher
 * "Diver" score. Returns only tags that appear, sorted high → low.
 */
export function computeTagScores(watches: RuleWatch[]): TagScore[] {
  const styleCounts = Object.fromEntries(
    PRIMARY_STYLES.map((s) => [s, 0])
  ) as Record<PrimaryStyle, number>
  const occasionCounts = Object.fromEntries(
    OCCASION_TAGS.map((t) => [t, 0])
  ) as Record<OccasionTag, number>

  for (const w of watches) {
    styleCounts[w.primaryStyle] += 1
    for (const tag of w.occasionTags) occasionCounts[tag] += 1
  }

  const maxStyle = Math.max(0, ...PRIMARY_STYLES.map((s) => styleCounts[s]))
  const maxOccasion = Math.max(0, ...OCCASION_TAGS.map((t) => occasionCounts[t]))

  const styleScores: TagScore[] = PRIMARY_STYLES.map((s) => ({
    key: s,
    label: PRIMARY_STYLE_LABELS[s],
    group: "style" as const,
    score: maxStyle > 0 ? Math.round((styleCounts[s] / maxStyle) * 100) : 0,
  }))

  const occasionScores: TagScore[] = OCCASION_TAGS.map((t) => ({
    key: t,
    label: OCCASION_TAG_LABELS[t],
    group: "occasion" as const,
    score: maxOccasion > 0 ? Math.round((occasionCounts[t] / maxOccasion) * 100) : 0,
  }))

  return [...styleScores, ...occasionScores]
    .filter((t) => t.score > 0)
    .sort((a, b) => b.score - a.score)
}
