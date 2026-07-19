import { getOpenAI, OPENAI_MODEL } from "@/lib/ai/client"
import type { EnrichedSpecs } from "./merge-specs"
import type { IdentifiedWatch } from "./match-catalog"

/** Deadline for the web fallback before we give up and return photo-only (spec). */
const WEB_LOOKUP_TIMEOUT_MS = 15_000

/**
 * Non-visible specs only — enrichment never speaks for what the photo shows.
 * Every field nullable: the model returns null for anything it can't find on a
 * source page, and must never invent a measurement.
 */
const enrichedSpecsSchema = {
  type: "json_schema" as const,
  name: "enriched_specs",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      reference: { type: ["string", "null"] },
      year: { type: ["number", "null"] },
      lugToLug: { type: ["number", "null"] },
      thickness: { type: ["number", "null"] },
      movement: { type: ["string", "null"] },
      waterResistance: { type: ["number", "null"] },
    },
    required: [
      "reference",
      "year",
      "lugToLug",
      "thickness",
      "movement",
      "waterResistance",
    ],
  },
} as const

/**
 * Tier 2 enrichment (catalog miss only): a single OpenAI web-search call that
 * looks up the identified watch on a real source page and extracts its
 * non-visible specs. Bounded by a ~15s deadline; any failure or timeout
 * resolves to null so the caller falls back to photo-only (ADR 0001).
 */
export async function lookupSpecsOnWeb(
  identified: IdentifiedWatch,
): Promise<EnrichedSpecs | null> {
  const query = [identified.brand, identified.model, identified.reference]
    .filter(Boolean)
    .join(" ")
    .trim()
  if (!query) return null

  try {
    const response = await getOpenAI().responses.create(
      {
        model: OPENAI_MODEL,
        tools: [{ type: "web_search" }],
        text: { format: enrichedSpecsSchema },
        input: `Find the manufacturer specifications for this wristwatch: ${query}. Search the web, read a reputable source page (brand site, retailer, or reference database), and extract only these specs: manufacturer reference, release year (4-digit), lug-to-lug (mm), case thickness (mm), movement/calibre, and water resistance (m). Use null for anything you can't confirm on the page — never invent a reference, year, or measurement.`,
      },
      { timeout: WEB_LOOKUP_TIMEOUT_MS },
    )

    const text = response.output_text
    if (!text) return null
    return JSON.parse(text) as EnrichedSpecs
  } catch (err) {
    console.error("lookupSpecsOnWeb error:", err)
    return null
  }
}
