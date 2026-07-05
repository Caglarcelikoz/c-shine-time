import type { CaseSizeBand, ColorFamily } from "@/lib/types"

/** Derived from caseSize (mm) — bands used for overlap detection. */
export function deriveCaseSizeBand(
  caseSize: number | null | undefined
): CaseSizeBand | null {
  if (caseSize == null || !Number.isFinite(caseSize)) return null
  if (caseSize < 38) return "lt38"
  if (caseSize <= 42) return "b38_42"
  return "gt42"
}

/** Derived from a free-text dial color — normalized into a small family set. */
export function deriveColorFamily(
  dialColor: string | null | undefined
): ColorFamily | null {
  if (!dialColor) return null
  const c = dialColor.toLowerCase()
  if (/black|onyx|noir/.test(c)) return "black"
  if (/white|silver|cream|opaline|ivory|champagne/.test(c)) return "white_silver"
  if (/blue|navy|teal/.test(c)) return "blue"
  if (/green|olive|emerald/.test(c)) return "green"
  if (/brown|bronze|salmon|copper|chocolate|tropical|gilt/.test(c))
    return "brown_bronze"
  return "other"
}
