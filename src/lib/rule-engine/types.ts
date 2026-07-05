import type {
  CaseSizeBand,
  ColorFamily,
  OccasionTag,
  PrimaryStyle,
  WatchStatus,
} from "@/lib/types"

/** Minimal watch shape the rule engine operates on — easy to construct in tests. */
export interface RuleWatch {
  id: string
  status: WatchStatus
  brand: string
  primaryStyle: PrimaryStyle
  secondaryStyle?: PrimaryStyle | null
  occasionTags: OccasionTag[]
  caseSizeBand?: CaseSizeBand | null
  colorFamily?: ColorFamily | null
  /** market value estimate, falling back to purchase price; null if unknown */
  price?: number | null
}

/** A hypothetical watch being scored — no id/status needed. */
export interface CandidateWatch {
  primaryStyle: PrimaryStyle
  occasionTags: OccasionTag[]
  caseSizeBand?: CaseSizeBand | null
  colorFamily?: ColorFamily | null
  price?: number | null
}

export interface Coverage {
  countsByStyle: Record<PrimaryStyle, number>
  missingStyles: PrimaryStyle[]
  overrepresented: { style: PrimaryStyle; count: number }[]
  occasionCounts: Record<OccasionTag, number>
  occasionGaps: OccasionTag[]
}

export interface OverlapResult {
  watchId: string
  overlapsWith: string[]
}

export interface TagScore {
  key: string
  label: string
  group: "style" | "occasion"
  score: number
}

export interface BudgetRange {
  min?: number | null
  max?: number | null
}

/** A watch overlaps another when style + color family + case band all match. */
export interface OverlapProfile {
  primaryStyle: PrimaryStyle
  colorFamily?: ColorFamily | null
  caseSizeBand?: CaseSizeBand | null
}

export const OVERREPRESENTED_THRESHOLD = 3
