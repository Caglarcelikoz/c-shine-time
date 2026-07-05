import type { OverlapProfile } from "./types"

/**
 * Two watches "overlap" only when primaryStyle + colorFamily + caseSizeBand all
 * match AND the color/band are known. Null fields never count as a match.
 */
export function sameOverlapProfile(a: OverlapProfile, b: OverlapProfile): boolean {
  if (!a.colorFamily || !a.caseSizeBand) return false
  return (
    a.primaryStyle === b.primaryStyle &&
    a.colorFamily === b.colorFamily &&
    a.caseSizeBand === b.caseSizeBand
  )
}

export function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n))
}
