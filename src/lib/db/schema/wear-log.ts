import { date, pgTable, text, timestamp, unique } from "drizzle-orm/pg-core"
import { createId } from "@paralleldrive/cuid2"
import { userWatches } from "./user-watch"

/** One row per calendar day the watch was worn — enforces at most once/day. */
export const wearLogs = pgTable(
  "wear_logs",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    userWatchId: text("user_watch_id")
      .notNull()
      .references(() => userWatches.id, { onDelete: "cascade" }),
    wornOn: date("worn_on", { mode: "string" }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [unique().on(table.userWatchId, table.wornOn)]
)

export type WearLog = typeof wearLogs.$inferSelect
export type NewWearLog = typeof wearLogs.$inferInsert
