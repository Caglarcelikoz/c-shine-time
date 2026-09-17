import { index, pgTable, text, timestamp } from "drizzle-orm/pg-core"
import { createId } from "@paralleldrive/cuid2"

export const rateLimitHits = pgTable(
  "rate_limit_hits",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    // "<action>:<identifier>", e.g. "login:email:a@b.com". Not unique — one row
    // per attempt is what makes the count meaningful.
    key: text("key").notNull(),
    hitAt: timestamp("hit_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("rate_limit_hits_key_hit_at_idx").on(table.key, table.hitAt)]
)

export type RateLimitHit = typeof rateLimitHits.$inferSelect
export type NewRateLimitHit = typeof rateLimitHits.$inferInsert
