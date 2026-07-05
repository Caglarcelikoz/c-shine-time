import type { RuleWatch } from "./types"

/** Build a RuleWatch with sensible defaults; override only what a test needs. */
export function makeWatch(overrides: Partial<RuleWatch> & { id: string }): RuleWatch {
  return {
    status: "owned",
    brand: "Test",
    primaryStyle: "diver",
    occasionTags: ["daily"],
    caseSizeBand: "b38_42",
    colorFamily: "black",
    price: null,
    ...overrides,
  }
}
