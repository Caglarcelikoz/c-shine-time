import { describe, it, expect } from "vitest"
import { mergeWatchSpecs, type EnrichedSpecs } from "./merge-specs"
import type { ImportedWatch } from "@/lib/ai/actions"

/** A photo reading with everything visible present and the rest null. */
function photoReading(overrides: Partial<ImportedWatch> = {}): ImportedWatch {
  return {
    isWatch: true,
    brand: "Rolex",
    model: "Submariner Date",
    reference: null,
    year: null,
    material: "Steel",
    caseSize: 41,
    lugToLug: null,
    thickness: null,
    movement: null,
    dialColor: "Blue",
    waterResistance: null,
    price: null,
    primaryStyle: "diver",
    occasionTags: ["daily"],
    ...overrides,
  }
}

describe("mergeWatchSpecs", () => {
  it("keeps every visible field the photo read — enrichment can't speak for them", () => {
    // EnrichedSpecs deliberately has no visible fields, so the type itself
    // prevents enrichment from carrying dialColor/material/caseSize/style.
    // Merging still leaves the photo's visible readings untouched.
    const photo = photoReading({
      dialColor: "Blue",
      material: "Steel",
      caseSize: 41,
    })
    const merged = mergeWatchSpecs(photo, {
      movement: "Caliber 3235 Automatic",
    })
    expect(merged.dialColor).toBe("Blue")
    expect(merged.material).toBe("Steel")
    expect(merged.caseSize).toBe(41)
    expect(merged.primaryStyle).toBe("diver")
  })

  it("fills the non-visible specs the photo left empty", () => {
    const photo = photoReading()
    const enriched: EnrichedSpecs = {
      movement: "Caliber 3235 Automatic",
      lugToLug: 48,
      thickness: 12.5,
      waterResistance: 300,
      year: 2020,
    }
    const merged = mergeWatchSpecs(photo, enriched)
    expect(merged.movement).toBe("Caliber 3235 Automatic")
    expect(merged.lugToLug).toBe(48)
    expect(merged.thickness).toBe(12.5)
    expect(merged.waterResistance).toBe(300)
    expect(merged.year).toBe(2020)
  })

  it("fills the reference only when the photo didn't read one", () => {
    const withRef = mergeWatchSpecs(photoReading({ reference: "PHOTO-REF" }), {
      reference: "CAT-REF",
    })
    expect(withRef.reference).toBe("PHOTO-REF")

    const withoutRef = mergeWatchSpecs(photoReading({ reference: null }), {
      reference: "CAT-REF",
    })
    expect(withoutRef.reference).toBe("CAT-REF")
  })

  it("never overwrites a non-empty non-visible field the photo already read", () => {
    const photo = photoReading({ movement: "Photo-read movement", year: 1999 })
    const enriched: EnrichedSpecs = { movement: "Caliber 3235", year: 2020 }
    const merged = mergeWatchSpecs(photo, enriched)
    expect(merged.movement).toBe("Photo-read movement")
    expect(merged.year).toBe(1999)
  })

  it("leaves the photo result unchanged when enrichment is empty", () => {
    const photo = photoReading({ movement: "Auto", year: 2020 })
    const merged = mergeWatchSpecs(photo, {})
    expect(merged).toEqual(photo)
  })

  it("does not let a null enriched value blank out a spec the photo read", () => {
    const photo = photoReading({ movement: "Photo-read movement" })
    const merged = mergeWatchSpecs(photo, { movement: null })
    expect(merged.movement).toBe("Photo-read movement")
  })
})
