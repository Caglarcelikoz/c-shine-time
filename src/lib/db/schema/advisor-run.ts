import { index, pgTable, text, timestamp } from "drizzle-orm/pg-core"
import { createId } from "@paralleldrive/cuid2"
import { users } from "./user"

/**
 * ADR 0005 — one row per successful AI action. Serves two consumers:
 * onboarding step 4 ("has this user ever run the advisor?") now, and the
 * Phase 4 (I3) free-tier monthly quota counter later.
 */
export const advisorRuns = pgTable(
  "advisor_runs",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /** AdvisorActionId, or: analyze_watch | compare | import_url | import_photo */
    action: text("action").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("advisor_runs_user_created_idx").on(table.userId, table.createdAt)]
)

export type AdvisorRun = typeof advisorRuns.$inferSelect
export type NewAdvisorRun = typeof advisorRuns.$inferInsert
