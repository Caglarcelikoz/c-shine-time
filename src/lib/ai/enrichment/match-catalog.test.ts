import { describe, it, expect } from "vitest"
import { matchCatalog } from "./match-catalog"
import type { WatchCatalogEntry } from "@/lib/db/schema"

/** Build a catalog row with sensible defaults; override only what a test needs. */
function makeEntry(
  overrides: Partial<WatchCatalogEntry> & { id: string },
): WatchCatalogEntry {
  return {
    brand: "Rolex",
    model: "Submariner Date",
    reference: "126610LN",
    year: 2020,
    caseSize: "41",
    thickness: "12.5",
    lugToLug: "48",
    movementType: "Caliber 3235 Automatic",
    dialColor: "Black",
    material: "Steel",
    waterResistance: 300,
    primaryStyle: "diver",
    occasionTags: ["daily"],
    ...overrides,
  }
}

describe("matchCatalog", () => {
  it("matches on exact reference over a fuzzy brand/model near-match", () => {
    const candidates = [
      makeEntry({ id: "wrong", reference: "999999", model: "Submariner" }),
      makeEntry({ id: "right", reference: "126610LN" }),
    ]
    const hit = matchCatalog(
      { brand: "Rolex", model: "Submariner", reference: "126610LN" },
      candidates,
    )
    expect(hit?.id).toBe("right")
  })

  it("falls through to brand+model when the reference is missing", () => {
    const candidates = [makeEntry({ id: "sub", reference: "126610LN" })]
    const hit = matchCatalog(
      { brand: "Rolex", model: "Submariner Date", reference: null },
      candidates,
    )
    expect(hit?.id).toBe("sub")
  })

  it("falls through to brand+model when the reference has no exact hit", () => {
    const candidates = [makeEntry({ id: "sub", reference: "126610LN" })]
    const hit = matchCatalog(
      { brand: "Rolex", model: "Submariner Date", reference: "UNKNOWN-REF" },
      candidates,
    )
    expect(hit?.id).toBe("sub")
  })

  it("matches a dial-only photo (no reference) on brand + model", () => {
    const candidates = [
      makeEntry({ id: "bb58", brand: "Tudor", model: "Black Bay 58", reference: "79030N" }),
      makeEntry({ id: "sub", brand: "Rolex", model: "Submariner Date" }),
    ]
    const hit = matchCatalog(
      { brand: "Tudor", model: "Black Bay 58", reference: null },
      candidates,
    )
    expect(hit?.id).toBe("bb58")
  })

  it("normalises case and spacing when matching brand + model", () => {
    const candidates = [makeEntry({ id: "sub", brand: "Rolex", model: "Submariner Date" })]
    const hit = matchCatalog(
      { brand: "  rolex ", model: "SUBMARINER   DATE", reference: null },
      candidates,
    )
    expect(hit?.id).toBe("sub")
  })

  it("returns null when nothing matches", () => {
    const candidates = [makeEntry({ id: "sub", brand: "Rolex", model: "Submariner Date" })]
    const hit = matchCatalog(
      { brand: "Casio", model: "F-91W", reference: null },
      candidates,
    )
    expect(hit).toBeNull()
  })

  it("returns null when the identification has no usable brand", () => {
    const candidates = [makeEntry({ id: "sub" })]
    const hit = matchCatalog({ brand: null, model: null, reference: null }, candidates)
    expect(hit).toBeNull()
  })
})
