import type { CollectionItem, OccasionTag, PrimaryStyle } from "@/lib/types"

export const ADVISOR_ACTIONS = [
  "recommend_next",
  "find_gaps",
  "what_to_sell",
  "alternatives_budget",
  "build_three",
  "roast",
  "compare",
  "prioritize_wishlist",
] as const

export type AdvisorActionId = (typeof ADVISOR_ACTIONS)[number] | "chat"

export const ADVISOR_ACTION_LABELS: Record<
  Exclude<AdvisorActionId, "chat">,
  string
> = {
  recommend_next: "Recommend my next watch",
  find_gaps: "Find gaps in my collection",
  what_to_sell: "What should I sell?",
  alternatives_budget: "Find alternatives under my budget",
  build_three: "Build a 3-watch collection",
  roast: "Roast my collection",
  compare: "Compare two watches",
  prioritize_wishlist: "Prioritize my wishlist",
}

/** A recommended (not-yet-owned) watch. fitScore is computed by us, never the LLM. */
export interface RecommendationCard {
  brand: string
  model: string
  reference: string
  primaryStyle: PrimaryStyle
  occasionTags: OccasionTag[]
  approxPrice: number
  whyItFits: string
  gapFilled: string
  downside: string
  fitScore: number | null
}

/** A reference to one of the user's own watches (owned or wishlist), resolved from DB. */
export interface OwnedReference {
  item: CollectionItem
  note: string
  fitScore?: number | null
}

export interface AdvisorResponse {
  action: AdvisorActionId
  message: string
  recommendations: RecommendationCard[]
  references: OwnedReference[]
  error?: string
}
