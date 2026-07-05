import { index, integer, numeric, pgTable, text } from "drizzle-orm/pg-core"
import { createId } from "@paralleldrive/cuid2"
import { occasionTagEnum, primaryStyleEnum } from "./enums"

/**
 * Shared reference data for the "add a watch" catalog search — NOT per-user
 * data. Selecting an entry pre-fills the add/edit form; the watches table
 * (per-user, free-text) is untouched and still gets a fresh row on save.
 */
export const watchCatalog = pgTable(
  "watch_catalog",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    brand: text("brand").notNull(),
    model: text("model").notNull(),
    reference: text("reference"),
    year: integer("year"),
    caseSize: numeric("case_size", { precision: 4, scale: 1 }),
    thickness: numeric("thickness", { precision: 4, scale: 1 }),
    lugToLug: numeric("lug_to_lug", { precision: 4, scale: 1 }),
    movementType: text("movement_type"),
    dialColor: text("dial_color"),
    material: text("material"),
    waterResistance: integer("water_resistance"),
    primaryStyle: primaryStyleEnum("primary_style").notNull(),
    occasionTags: occasionTagEnum("occasion_tags").array().notNull(),
  },
  (table) => [index("watch_catalog_brand_model_idx").on(table.brand, table.model)]
)

export type WatchCatalogEntry = typeof watchCatalog.$inferSelect
export type NewWatchCatalogEntry = typeof watchCatalog.$inferInsert
