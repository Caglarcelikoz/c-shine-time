import { or, ilike, sql } from "drizzle-orm"
import { db } from "@/lib/db"
import { watchCatalog, type WatchCatalogEntry } from "@/lib/db/schema"
import { matchCatalog, type IdentifiedWatch } from "./match-catalog"
import { lookupSpecsOnWeb } from "./web-lookup"
import type { EnrichedSpecs } from "./merge-specs"

export type { IdentifiedWatch } from "./match-catalog"
export { mergeWatchSpecs, type EnrichedSpecs } from "./merge-specs"

/** Where the enriched specs came from — drives the form's one-line source note. */
export type EnrichmentSource = "catalog" | "web" | null

export interface EnrichmentResult {
  specs: EnrichedSpecs
  source: EnrichmentSource
}

/** `numeric` catalog columns come back as strings — coerce to a number or null. */
function num(value: string | null): number | null {
  if (value == null) return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

/** Map a matched catalog row onto the non-visible specs enrichment contributes. */
function toEnrichedSpecs(entry: WatchCatalogEntry): EnrichedSpecs {
  return {
    reference: entry.reference,
    year: entry.year,
    lugToLug: num(entry.lugToLug),
    thickness: num(entry.thickness),
    movement: entry.movementType,
    waterResistance: entry.waterResistance,
  }
}

/** Candidate rows for matching: exact reference, or the same brand+model. */
async function fetchCandidates(
  identified: IdentifiedWatch,
): Promise<WatchCatalogEntry[]> {
  const filters = []
  if (identified.reference) {
    // Match matchCatalog's ref normalization (case + whitespace insensitive)
    // in SQL, so a stored "126610 LN" is still a candidate for "126610LN".
    const target = identified.reference.replace(/\s+/g, "").toLowerCase()
    filters.push(
      sql`lower(replace(${watchCatalog.reference}, ' ', '')) = ${target}`,
    )
  }
  if (identified.brand)
    filters.push(ilike(watchCatalog.brand, identified.brand.trim()))
  if (filters.length === 0) return []
  return db.select().from(watchCatalog).where(or(...filters))
}

/**
 * Enrich an identified watch with its non-visible specs, catalog-first: match
 * the shared watch_catalog (free, instant); only on a miss fall back to the
 * paid web lookup. Either failure resolves to empty specs with a null source,
 * so the caller falls back to photo-only (ADR 0001).
 */
export async function enrichSpecs(
  identified: IdentifiedWatch,
): Promise<EnrichmentResult> {
  if (!identified.brand && !identified.reference) {
    return { specs: {}, source: null }
  }

  try {
    const candidates = await fetchCandidates(identified)
    const hit = matchCatalog(identified, candidates)
    if (hit) return { specs: toEnrichedSpecs(hit), source: "catalog" }
  } catch (err) {
    console.error("enrichSpecs catalog error:", err)
  }

  const web = await lookupSpecsOnWeb(identified)
  if (web) return { specs: web, source: "web" }

  return { specs: {}, source: null }
}
