/** The minimum a candidate needs for featured-piece resolution. */
interface FeaturedCandidate {
  id: string
  createdAt: Date
}

/**
 * Decide which public owned watch is the featured piece (ADR 0006).
 *
 * `featuredWatchId` is the owner's stored choice, treated as a *hint* validated
 * live against the current candidate set: honoured only while it still points at
 * a public owned watch. Otherwise — and when there's no choice — the newest
 * public owned watch stands in. This can never leak a private/sold watch and
 * never drifts: a deleted, privated, or sold watch simply isn't in `publicOwned`.
 *
 * Returns null only when there are no public owned watches at all.
 */
export function resolveFeaturedPiece<T extends FeaturedCandidate>(
  featuredWatchId: string | null,
  publicOwned: T[],
): T | null {
  if (publicOwned.length === 0) return null

  if (featuredWatchId) {
    const chosen = publicOwned.find((w) => w.id === featuredWatchId)
    if (chosen) return chosen
  }

  // Newest wins; ties break on id so the fallback is fully deterministic
  // (equal createdAt would otherwise keep arbitrary input order).
  return publicOwned.reduce((newest, w) => {
    if (w.createdAt > newest.createdAt) return w
    if (w.createdAt < newest.createdAt) return newest
    return w.id < newest.id ? w : newest
  })
}
