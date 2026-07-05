import { describe, it, expect } from "vitest"
import { computeCoverage } from "./coverage"
import { makeWatch } from "./test-helpers"

describe("computeCoverage", () => {
  it("reports a missing style (5x diver/field/sport, 0 dress)", () => {
    const watches = [
      makeWatch({ id: "1", primaryStyle: "diver" }),
      makeWatch({ id: "2", primaryStyle: "diver" }),
      makeWatch({ id: "3", primaryStyle: "diver" }),
      makeWatch({ id: "4", primaryStyle: "field" }),
      makeWatch({ id: "5", primaryStyle: "field" }),
      makeWatch({ id: "6", primaryStyle: "sport_casual" }),
      makeWatch({ id: "7", primaryStyle: "sport_casual" }),
    ]
    const cov = computeCoverage(watches)
    expect(cov.missingStyles).toContain("dress")
    expect(cov.missingStyles).toContain("chronograph")
    expect(cov.missingStyles).not.toContain("diver")
  })

  it("flags overrepresented styles (3+ of the same)", () => {
    const watches = [
      makeWatch({ id: "1", primaryStyle: "diver" }),
      makeWatch({ id: "2", primaryStyle: "diver" }),
      makeWatch({ id: "3", primaryStyle: "diver" }),
    ]
    const cov = computeCoverage(watches)
    expect(cov.overrepresented).toEqual([{ style: "diver", count: 3 }])
  })

  it("handles an empty collection (everything missing, no overrep)", () => {
    const cov = computeCoverage([])
    expect(cov.missingStyles).toHaveLength(7)
    expect(cov.overrepresented).toEqual([])
    expect(cov.occasionGaps).toHaveLength(6)
  })

  it("reports occasion gaps from the tags used", () => {
    const watches = [
      makeWatch({ id: "1", occasionTags: ["daily", "outdoor"] }),
      makeWatch({ id: "2", occasionTags: ["daily"] }),
    ]
    const cov = computeCoverage(watches)
    expect(cov.occasionGaps).toContain("formal")
    expect(cov.occasionGaps).toContain("travel")
    expect(cov.occasionGaps).not.toContain("daily")
    expect(cov.occasionCounts.daily).toBe(2)
  })

  it("is fully varied — no missing styles when all 7 present", () => {
    const watches = [
      makeWatch({ id: "1", primaryStyle: "diver" }),
      makeWatch({ id: "2", primaryStyle: "dress" }),
      makeWatch({ id: "3", primaryStyle: "field" }),
      makeWatch({ id: "4", primaryStyle: "chronograph" }),
      makeWatch({ id: "5", primaryStyle: "gmt_travel" }),
      makeWatch({ id: "6", primaryStyle: "pilot" }),
      makeWatch({ id: "7", primaryStyle: "sport_casual" }),
    ]
    const cov = computeCoverage(watches)
    expect(cov.missingStyles).toHaveLength(0)
    expect(cov.overrepresented).toHaveLength(0)
  })
})
