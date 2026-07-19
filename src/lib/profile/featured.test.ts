import { describe, it, expect } from "vitest"
import { resolveFeaturedPiece } from "./featured"

/** Minimal candidate: the resolver only needs an id and a createdAt. */
function cand(id: string, createdAt: string) {
  return { id, createdAt: new Date(createdAt) }
}

describe("resolveFeaturedPiece", () => {
  const older = cand("a", "2026-01-01")
  const newer = cand("b", "2026-06-01")
  const newest = cand("c", "2026-07-01")
  const publicOwned = [older, newer, newest]

  it("honours an explicit choice that is still a public owned watch", () => {
    const picked = resolveFeaturedPiece("a", publicOwned)
    expect(picked?.id).toBe("a")
  })

  it("falls back to the newest public owned watch when there is no choice", () => {
    const picked = resolveFeaturedPiece(null, publicOwned)
    expect(picked?.id).toBe("c")
  })

  it("falls back to newest when the chosen watch is no longer a candidate", () => {
    // 'z' was deleted / made private / sold — not in publicOwned anymore.
    const picked = resolveFeaturedPiece("z", publicOwned)
    expect(picked?.id).toBe("c")
  })

  it("returns null when there are no public owned watches", () => {
    expect(resolveFeaturedPiece("a", [])).toBeNull()
    expect(resolveFeaturedPiece(null, [])).toBeNull()
  })

  it("picks the most recent createdAt for the fallback regardless of input order", () => {
    const shuffled = [newest, older, newer]
    const picked = resolveFeaturedPiece(null, shuffled)
    expect(picked?.id).toBe("c")
  })

  it("breaks equal-createdAt ties deterministically on id, not input order", () => {
    const same = "2026-05-05"
    const tieA = { id: "y", createdAt: new Date(same) }
    const tieB = { id: "x", createdAt: new Date(same) }
    // Same timestamp, opposite input orders — must resolve to the same watch.
    expect(resolveFeaturedPiece(null, [tieA, tieB])?.id).toBe("x")
    expect(resolveFeaturedPiece(null, [tieB, tieA])?.id).toBe("x")
  })
})
