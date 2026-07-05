import {
  boolean,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"
import { createId } from "@paralleldrive/cuid2"
import {
  caseSizeBandEnum,
  colorFamilyEnum,
  occasionTagEnum,
  primaryStyleEnum,
  timeHorizonEnum,
  watchStatusEnum,
  wishlistStatusLabelEnum,
} from "./enums"
import { users } from "./user"
import { watches } from "./watch"

export const userWatches = pgTable("user_watches", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  watchId: text("watch_id")
    .notNull()
    .references(() => watches.id, { onDelete: "restrict" }),

  status: watchStatusEnum("status").notNull().default("owned"),

  primaryStyle: primaryStyleEnum("primary_style").notNull(),
  secondaryStyle: primaryStyleEnum("secondary_style"),
  occasionTags: occasionTagEnum("occasion_tags").array().notNull(),

  caseSizeBand: caseSizeBandEnum("case_size_band"),
  colorFamily: colorFamilyEnum("color_family"),

  currency: text("currency").notNull().default("EUR"),
  purchasePrice: numeric("purchase_price", { precision: 10, scale: 2 }),
  purchaseDate: timestamp("purchase_date", { withTimezone: true }),
  marketValueEstimate: numeric("market_value_estimate", { precision: 10, scale: 2 }),

  notes: text("notes"),
  story: text("story"),

  isPublic: boolean("is_public").notNull().default(false),
  serialNumber: text("serial_number"),

  fitScore: integer("fit_score"),

  // Wishlist-specific fields (used when status = 'wishlist' or 'grail')
  timeHorizon: timeHorizonEnum("time_horizon"),
  targetPrice: numeric("target_price", { precision: 10, scale: 2 }),
  wishlistReason: text("wishlist_reason"),
  wishlistBlockers: text("wishlist_blockers"),
  wishlistStatusLabel: wishlistStatusLabelEnum("wishlist_status_label"),

  // Phase 3 — service (wear tracking now lives in wear_logs, one row per day worn)
  lastServiceDate: timestamp("last_service_date", { withTimezone: true }),
  nextServiceDue: timestamp("next_service_due", { withTimezone: true }),
  warrantyExpiresAt: timestamp("warranty_expires_at", { withTimezone: true }),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})

export const userWatchRelations = relations(userWatches, ({ one }) => ({
  user: one(users, { fields: [userWatches.userId], references: [users.id] }),
  watch: one(watches, { fields: [userWatches.watchId], references: [watches.id] }),
}))

export const usersRelations = relations(users, ({ many }) => ({
  userWatches: many(userWatches),
}))

export const watchesRelations = relations(watches, ({ many }) => ({
  userWatches: many(userWatches),
}))

export type UserWatch = typeof userWatches.$inferSelect
export type NewUserWatch = typeof userWatches.$inferInsert
