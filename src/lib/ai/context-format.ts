import type { AdvisorContext } from "@/lib/rule-engine"
import {
  CASE_SIZE_BAND_LABELS,
  COLOR_FAMILY_LABELS,
  OCCASION_TAG_LABELS,
  PRIMARY_STYLE_LABELS,
} from "@/lib/labels"
import { formatMoney } from "@/lib/currency"
import type { CollectionItem } from "@/lib/types"

function lineFor(item: CollectionItem): string {
  const w = item.watch
  const specs = [
    w.caseSize ? `${w.caseSize}mm` : null,
    item.caseSizeBand ? CASE_SIZE_BAND_LABELS[item.caseSizeBand] : null,
    item.colorFamily ? COLOR_FAMILY_LABELS[item.colorFamily] : null,
    w.movementType,
  ]
    .filter(Boolean)
    .join(", ")
  const tags = item.occasionTags.map((t) => OCCASION_TAG_LABELS[t]).join("/")
  const price = formatMoney(
    item.marketValueEstimate ?? item.purchasePrice ?? item.targetPrice,
    item.currency
  )
  return `- [id:${item.id}] ${w.brand} ${w.model} — ${PRIMARY_STYLE_LABELS[item.primaryStyle]}; ${tags}; ${specs}${price ? `; ~${price}` : ""}`
}

/** Serialize the structured context into a compact block for the system prompt. */
export function formatContext(ctx: AdvisorContext): string {
  const owned = ctx.items.filter((i) => i.status === "owned")
  const wishlist = ctx.items.filter(
    (i) => i.status === "wishlist" || i.status === "grail"
  )

  const missing = ctx.computedAnalysis.missingStyles
    .map((s) => PRIMARY_STYLE_LABELS[s])
    .join(", ") || "none"
  const overrep = ctx.computedAnalysis.overrepresented
    .map((o) => `${PRIMARY_STYLE_LABELS[o.style]} (${o.count})`)
    .join(", ") || "none"
  const occGaps = ctx.computedAnalysis.occasionGaps
    .map((t) => OCCASION_TAG_LABELS[t])
    .join(", ") || "none"

  const overlapPairs = ctx.overlaps
    .filter((o) => o.overlapsWith.length > 0)
    .map((o) => `${o.watchId} ↔ ${o.overlapsWith.join(", ")}`)
    .join("; ") || "none"

  const tags = ctx.tasteProfile.tagScores
    .map((t) => `${t.label} ${t.score}`)
    .join(", ")

  const budget = ctx.tasteProfile.budgetRange
  const budgetStr = budget
    ? `~${budget.min}–${budget.max} (derived from owned prices)`
    : "unknown"

  return [
    `OWNED WATCHES (${owned.length}):`,
    owned.length ? owned.map(lineFor).join("\n") : "  (none)",
    "",
    `WISHLIST (${wishlist.length}):`,
    wishlist.length ? wishlist.map(lineFor).join("\n") : "  (none)",
    "",
    "COMPUTED ANALYSIS (authoritative — do not recompute or contradict):",
    `  Missing styles: ${missing}`,
    `  Overrepresented styles: ${overrep}`,
    `  Occasion gaps: ${occGaps}`,
    `  Overlapping pairs (by id): ${overlapPairs}`,
    "",
    `TASTE PROFILE (0-100): ${tags || "n/a"}`,
    `TOP BRANDS: ${ctx.tasteProfile.topBrands.map((b) => `${b.brand}(${b.count})`).join(", ") || "n/a"}`,
    `BUDGET BAND: ${budgetStr}`,
  ].join("\n")
}
