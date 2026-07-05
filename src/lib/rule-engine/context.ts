import { getCollection } from "@/lib/collection/queries"
import type { CollectionItem } from "@/lib/types"
import { computeCoverage } from "./coverage"
import { detectOverlaps } from "./overlap"
import { computeTagScores } from "./taste-profile"
import type {
  BudgetRange,
  Coverage,
  OverlapResult,
  RuleWatch,
  TagScore,
} from "./types"

/** Map a DB CollectionItem into the rule engine's minimal RuleWatch shape. */
export function toRuleWatch(item: CollectionItem): RuleWatch {
  const price =
    item.marketValueEstimate != null
      ? Number(item.marketValueEstimate)
      : item.purchasePrice != null
        ? Number(item.purchasePrice)
        : null
  return {
    id: item.id,
    status: item.status,
    brand: item.watch.brand,
    primaryStyle: item.primaryStyle,
    secondaryStyle: item.secondaryStyle,
    occasionTags: item.occasionTags,
    caseSizeBand: item.caseSizeBand,
    colorFamily: item.colorFamily,
    price: Number.isFinite(price as number) ? price : null,
  }
}

export interface DerivedTasteProfile {
  topBrands: { brand: string; count: number }[]
  priceStats: { min: number; max: number; avg: number } | null
  budgetRange: BudgetRange | null
  tagScores: TagScore[]
}

/** A light, derived taste profile (no dedicated table yet — Phase 2). */
function deriveTasteProfile(owned: RuleWatch[], tagScores: TagScore[]): DerivedTasteProfile {
  const brandCounts = new Map<string, number>()
  for (const w of owned) brandCounts.set(w.brand, (brandCounts.get(w.brand) ?? 0) + 1)
  const topBrands = [...brandCounts.entries()]
    .map(([brand, count]) => ({ brand, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  const prices = owned
    .map((w) => w.price)
    .filter((p): p is number => p != null && Number.isFinite(p))

  const priceStats =
    prices.length > 0
      ? {
          min: Math.min(...prices),
          max: Math.max(...prices),
          avg: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
        }
      : null

  // A soft, derived budget band around what they actually buy — not user-set.
  const budgetRange = priceStats
    ? { min: Math.round(priceStats.min * 0.7), max: Math.round(priceStats.max * 1.3) }
    : null

  return { topBrands, priceStats, budgetRange, tagScores }
}

export interface AdvisorContext {
  /** Raw owned + wishlist items, for resolving references back to full specs. */
  items: CollectionItem[]
  ownedWatches: RuleWatch[]
  wishlist: RuleWatch[]
  tasteProfile: DerivedTasteProfile
  computedAnalysis: {
    missingStyles: Coverage["missingStyles"]
    overrepresented: Coverage["overrepresented"]
    occasionGaps: Coverage["occasionGaps"]
  }
  coverage: Coverage
  overlaps: OverlapResult[]
}

/**
 * C5 — Shared context builder. One function that combines all rule-engine output
 * with the raw collection, reused by every AI action in Epic D.
 */
export async function buildAdvisorContext(userId: string): Promise<AdvisorContext> {
  const items = await getCollection(userId)
  const ruleWatches = items.map(toRuleWatch)

  const ownedWatches = ruleWatches.filter((w) => w.status === "owned")
  const wishlist = ruleWatches.filter(
    (w) => w.status === "wishlist" || w.status === "grail"
  )

  const coverage = computeCoverage(ownedWatches)
  const overlaps = detectOverlaps(ownedWatches)
  const tagScores = computeTagScores(ownedWatches)
  const tasteProfile = deriveTasteProfile(ownedWatches, tagScores)

  return {
    items,
    ownedWatches,
    wishlist,
    tasteProfile,
    computedAnalysis: {
      missingStyles: coverage.missingStyles,
      overrepresented: coverage.overrepresented,
      occasionGaps: coverage.occasionGaps,
    },
    coverage,
    overlaps,
  }
}
