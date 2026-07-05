import { describe, it, expect } from "vitest"
import { computeFitScore } from "./fit-score"
import { makeWatch } from "./test-helpers"
import type { CandidateWatch } from "./types"

const owned = [
  makeWatch({ id: "1", primaryStyle: "diver", colorFamily: "black", caseSizeBand: "b38_42" }),
  makeWatch({ id: "2", primaryStyle: "diver", colorFamily: "black", caseSizeBand: "b38_42" }),
  makeWatch({ id: "3", primaryStyle: "diver", colorFamily: "black", caseSizeBand: "b38_42" }),
]

describe("computeFitScore", () => {
  it("scores a gap-filling, non-overlapping watch far higher than an overlapping one", () => {
    const fillsGap: CandidateWatch = {
      primaryStyle: "dress",
      occasionTags: ["formal"],
      colorFamily: "white_silver",
      caseSizeBand: "lt38",
    }
    const overlaps: CandidateWatch = {
      primaryStyle: "diver",
      occasionTags: ["daily"],
      colorFamily: "black",
      caseSizeBand: "b38_42",
    }
    const gapScore = computeFitScore(fillsGap, owned)
    const overlapScore = computeFitScore(overlaps, owned)
    expect(gapScore).toBeGreaterThan(overlapScore + 30)
  })

  it("is deterministic — same input, same output", () => {
    const candidate: CandidateWatch = {
      primaryStyle: "field",
      occasionTags: ["outdoor"],
      colorFamily: "green",
      caseSizeBand: "b38_42",
    }
    const a = computeFitScore(candidate, owned)
    const b = computeFitScore(candidate, owned)
    expect(a).toBe(b)
  })

  it("rewards budget fit and penalizes going over budget", () => {
    const candidate: CandidateWatch = {
      primaryStyle: "dress",
      occasionTags: ["formal"],
      colorFamily: "white_silver",
      caseSizeBand: "lt38",
      price: 3000,
    }
    const inBudget = computeFitScore(candidate, owned, { min: 1000, max: 5000 })
    const overBudget = computeFitScore(
      { ...candidate, price: 9000 },
      owned,
      { min: 1000, max: 5000 }
    )
    expect(inBudget).toBeGreaterThan(overBudget)
  })

  it("stays within 0-100", () => {
    const candidate: CandidateWatch = {
      primaryStyle: "diver",
      occasionTags: ["daily"],
      colorFamily: "black",
      caseSizeBand: "b38_42",
      price: 99999,
    }
    const score = computeFitScore(candidate, owned, { max: 1000 })
    expect(score).toBeGreaterThanOrEqual(0)
    expect(score).toBeLessThanOrEqual(100)
  })
})
