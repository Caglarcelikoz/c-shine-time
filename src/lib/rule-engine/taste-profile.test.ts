import { describe, it, expect } from "vitest"
import { computeTagScores } from "./taste-profile"
import { makeWatch } from "./test-helpers"

describe("computeTagScores", () => {
  it("normalizes 0-100 with the dominant style at 100", () => {
    const watches = [
      makeWatch({ id: "1", primaryStyle: "diver" }),
      makeWatch({ id: "2", primaryStyle: "diver" }),
      makeWatch({ id: "3", primaryStyle: "diver" }),
      makeWatch({ id: "4", primaryStyle: "dress" }),
    ]
    const scores = computeTagScores(watches)
    const diver = scores.find((s) => s.key === "diver")
    const dress = scores.find((s) => s.key === "dress")
    expect(diver?.score).toBe(100)
    expect(dress?.score).toBe(33) // 1/3 → 33
    expect(diver!.score).toBeGreaterThan(dress!.score)
  })

  it("returns scores sorted high → low and omits zero/absent tags", () => {
    const watches = [
      makeWatch({ id: "1", primaryStyle: "diver", occasionTags: ["daily"] }),
      makeWatch({ id: "2", primaryStyle: "field", occasionTags: ["outdoor"] }),
    ]
    const scores = computeTagScores(watches)
    // sorted descending
    for (let i = 1; i < scores.length; i++) {
      expect(scores[i - 1].score).toBeGreaterThanOrEqual(scores[i].score)
    }
    // absent styles (e.g. pilot) are not present
    expect(scores.find((s) => s.key === "pilot")).toBeUndefined()
  })

  it("returns an empty array for an empty collection", () => {
    expect(computeTagScores([])).toEqual([])
  })
})
