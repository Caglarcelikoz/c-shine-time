import type { WatchCatalogEntry } from "@/lib/db/schema"

/** The brand/model/reference a vision pass identified from the photo(s). */
export interface IdentifiedWatch {
  brand: string | null
  model: string | null
  reference: string | null
}

/** Normalise a reference for comparison: drop case and all whitespace. */
function normRef(ref: string): string {
  return ref.replace(/\s+/g, "").toLowerCase()
}

/** Normalise a name (brand/model) for comparison: lowercase, collapse spacing. */
function normName(name: string): string {
  return name.trim().replace(/\s+/g, " ").toLowerCase()
}

/**
 * Decide which catalog row (if any) an identified watch matches. Exact
 * reference wins; failing that, an exact brand + model match (normalised for
 * case and spacing) so a dial-only photo with no readable reference still
 * resolves. Anything ambiguous or absent returns null rather than a guess —
 * a wrong variant is worse than falling through to the web fallback.
 */
export function matchCatalog(
  identified: IdentifiedWatch,
  candidates: WatchCatalogEntry[],
): WatchCatalogEntry | null {
  if (identified.reference) {
    const target = normRef(identified.reference)
    const byRef = candidates.find(
      (c) => c.reference && normRef(c.reference) === target,
    )
    if (byRef) return byRef
  }

  if (identified.brand && identified.model) {
    const brand = normName(identified.brand)
    const model = normName(identified.model)
    const byName = candidates.find(
      (c) => normName(c.brand) === brand && normName(c.model) === model,
    )
    if (byName) return byName
  }

  return null
}
