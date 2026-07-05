import { z } from "zod"
import {
  OCCASION_TAGS,
  PRIMARY_STYLES,
  TIME_HORIZONS,
  WISHLIST_STATUS_LABELS_VALUES,
} from "@/lib/types"

/** Coerce an optional numeric form value: "" → undefined, else a finite number. */
const optionalNumber = z.preprocess((v) => {
  if (v === "" || v == null) return undefined
  const n = Number(v)
  return Number.isFinite(n) ? n : v // non-numeric stays to trigger error
}, z.number().optional())

export const WatchFormSchema = z.object({
  // Catalog identity
  brand: z.string().min(1, { error: "Brand is required." }).trim(),
  model: z.string().min(1, { error: "Model is required." }).trim(),
  reference: z.string().trim().optional(),
  year: optionalNumber.pipe(
    z.number().int().min(1900).max(2100).optional()
  ),
  imageUrls: z
    .array(z.url({ error: "Enter a valid image URL." }))
    .max(5, { error: "Up to 5 photos per watch." })
    .optional(),

  // Catalog specs
  caseSize: optionalNumber.pipe(z.number().min(20).max(60).optional()),
  thickness: optionalNumber.pipe(z.number().min(2).max(30).optional()),
  lugToLug: optionalNumber.pipe(z.number().min(20).max(70).optional()),
  movementType: z.string().trim().optional(),
  dialColor: z.string().trim().optional(),
  material: z.string().trim().optional(),
  waterResistance: optionalNumber.pipe(
    z.number().int().min(0).max(10000).optional()
  ),

  // Mandatory classification
  primaryStyle: z.enum(PRIMARY_STYLES, {
    error: "Select a primary style.",
  }),
  secondaryStyle: z
    .union([z.literal(""), z.enum(PRIMARY_STYLES)])
    .optional(),
  occasionTags: z
    .array(z.enum(OCCASION_TAGS))
    .min(1, { error: "Select at least one occasion tag." }),

  // Ownership / private
  currency: z.string().trim().optional(),
  purchasePrice: optionalNumber.pipe(z.number().min(0).optional()),
  purchaseDate: z.string().trim().optional(),
  marketValueEstimate: optionalNumber.pipe(z.number().min(0).optional()),
  serialNumber: z.string().trim().optional(),

  // Narrative
  notes: z.string().trim().optional(),
  story: z.string().trim().optional(),

  // Privacy
  isPublic: z.boolean().optional(),

  // Wishlist-only (ignored for owned)
  targetPrice: optionalNumber.pipe(z.number().min(0).optional()),
  timeHorizon: z.union([z.literal(""), z.enum(TIME_HORIZONS)]).optional(),
  wishlistStatusLabel: z
    .union([z.literal(""), z.enum(WISHLIST_STATUS_LABELS_VALUES)])
    .optional(),
  wishlistReason: z.string().trim().optional(),
})

export type WatchFormValues = z.infer<typeof WatchFormSchema>

/** Extract + shape raw FormData into the object the schema validates. */
export function rawFromFormData(formData: FormData) {
  return {
    brand: formData.get("brand"),
    model: formData.get("model"),
    reference: formData.get("reference") || undefined,
    year: formData.get("year"),
    imageUrls: formData.getAll("imageUrls").map(String).filter(Boolean),
    caseSize: formData.get("caseSize"),
    thickness: formData.get("thickness"),
    lugToLug: formData.get("lugToLug"),
    movementType: formData.get("movementType") || undefined,
    dialColor: formData.get("dialColor") || undefined,
    material: formData.get("material") || undefined,
    waterResistance: formData.get("waterResistance"),
    currency: formData.get("currency") || undefined,
    primaryStyle: formData.get("primaryStyle"),
    secondaryStyle: formData.get("secondaryStyle") || "",
    occasionTags: formData.getAll("occasionTags").map(String),
    purchasePrice: formData.get("purchasePrice"),
    purchaseDate: formData.get("purchaseDate") || undefined,
    marketValueEstimate: formData.get("marketValueEstimate"),
    serialNumber: formData.get("serialNumber") || undefined,
    targetPrice: formData.get("targetPrice"),
    timeHorizon: formData.get("timeHorizon") || "",
    wishlistStatusLabel: formData.get("wishlistStatusLabel") || "",
    wishlistReason: formData.get("wishlistReason") || undefined,
    notes: formData.get("notes") || undefined,
    story: formData.get("story") || undefined,
    isPublic: formData.get("isPublic") === "on",
  }
}
