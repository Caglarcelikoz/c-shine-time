import type { ImportedWatch } from "@/lib/ai/actions"

/**
 * Specs an enrichment source (catalog row or web lookup) can contribute. Only
 * the non-visible fields — enrichment never speaks for what the photo shows
 * directly (dial colour, material, case size, style). A field is absent or
 * null when the source doesn't know it.
 */
export interface EnrichedSpecs {
  reference?: string | null
  year?: number | null
  lugToLug?: number | null
  thickness?: number | null
  movement?: string | null
  waterResistance?: number | null
}

/** Take the enriched value only if it exists and the photo left the field empty. */
function fill<T>(photoValue: T | null, enriched: T | null | undefined): T | null {
  if (photoValue != null) return photoValue
  return enriched ?? null
}

/**
 * Merge enrichment into a photo reading. The photo is authoritative for every
 * visible field — it reflects the actual variant in the collector's hand — so
 * those pass through untouched. Enrichment only fills non-visible specs the
 * photo left empty; it never overwrites a value the photo already read, and an
 * empty source leaves the photo result unchanged.
 */
export function mergeWatchSpecs(
  photo: ImportedWatch,
  enriched: EnrichedSpecs,
): ImportedWatch {
  return {
    ...photo,
    reference: fill(photo.reference, enriched.reference),
    year: fill(photo.year, enriched.year),
    lugToLug: fill(photo.lugToLug, enriched.lugToLug),
    thickness: fill(photo.thickness, enriched.thickness),
    movement: fill(photo.movement, enriched.movement),
    waterResistance: fill(photo.waterResistance, enriched.waterResistance),
  }
}
