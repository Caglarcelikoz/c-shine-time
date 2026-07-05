import { integer, numeric, pgTable, text, timestamp } from "drizzle-orm/pg-core"
import { createId } from "@paralleldrive/cuid2"

export const watches = pgTable("watches", {
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
  imageUrls: text("image_urls").array().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

export type Watch = typeof watches.$inferSelect
export type NewWatch = typeof watches.$inferInsert
