import { boolean, pgTable, text, timestamp } from "drizzle-orm/pg-core"
import { createId } from "@paralleldrive/cuid2"

export const users = pgTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  name: text("name").notNull(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  avatar: text("avatar"),
  bio: text("bio"),
  publicProfileEnabled: boolean("public_profile_enabled").notNull().default(false),
  hideCollectionValue: boolean("hide_collection_value").notNull().default(false),
  hidePurchasePrices: boolean("hide_purchase_prices").notNull().default(false),
  hideWishlist: boolean("hide_wishlist").notNull().default(false),
  hideSoldArchive: boolean("hide_sold_archive").notNull().default(false),
  profileTheme: text("profile_theme").notNull().default("classic"),
  /** ADR 0004 — setup checklist dismissal; steps themselves are derived. */
  onboardingDismissedAt: timestamp("onboarding_dismissed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
