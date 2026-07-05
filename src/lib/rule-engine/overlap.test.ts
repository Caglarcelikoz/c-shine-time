import { describe, it, expect } from "vitest"
import { detectOverlaps } from "./overlap"
import { makeWatch } from "./test-helpers"

describe("detectOverlaps", () => {
  it("marks two black 40mm divers as overlapping", () => {
    const watches = [
      makeWatch({ id: "a", primaryStyle: "diver", colorFamily: "black", caseSizeBand: "b38_42" }),
      makeWatch({ id: "b", primaryStyle: "diver", colorFamily: "black", caseSizeBand: "b38_42" }),
    ]
    const result = detectOverlaps(watches)
    expect(result.find((r) => r.watchId === "a")?.overlapsWith).toEqual(["b"])
    expect(result.find((r) => r.watchId === "b")?.overlapsWith).toEqual(["a"])
  })

  it("does not overlap a black diver with a white dress watch", () => {
    const watches = [
      makeWatch({ id: "a", primaryStyle: "diver", colorFamily: "black", caseSizeBand: "b38_42" }),
      makeWatch({ id: "b", primaryStyle: "dress", colorFamily: "white_silver", caseSizeBand: "lt38" }),
    ]
    const result = detectOverlaps(watches)
    expect(result.find((r) => r.watchId === "a")?.overlapsWith).toEqual([])
    expect(result.find((r) => r.watchId === "b")?.overlapsWith).toEqual([])
  })

  it("does not overlap when case band differs", () => {
    const watches = [
      makeWatch({ id: "a", primaryStyle: "diver", colorFamily: "black", caseSizeBand: "b38_42" }),
      makeWatch({ id: "b", primaryStyle: "diver", colorFamily: "black", caseSizeBand: "gt42" }),
    ]
    const result = detectOverlaps(watches)
    expect(result.find((r) => r.watchId === "a")?.overlapsWith).toEqual([])
  })

  it("never overlaps when color family is unknown", () => {
    const watches = [
      makeWatch({ id: "a", primaryStyle: "diver", colorFamily: null, caseSizeBand: "b38_42" }),
      makeWatch({ id: "b", primaryStyle: "diver", colorFamily: null, caseSizeBand: "b38_42" }),
    ]
    const result = detectOverlaps(watches)
    expect(result.find((r) => r.watchId === "a")?.overlapsWith).toEqual([])
  })
})
