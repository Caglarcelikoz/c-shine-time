import { integer, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core"
import { createId } from "@paralleldrive/cuid2"
import { users } from "./user"
import { userWatches } from "./user-watch"

export const documentTypeEnum = pgEnum("document_type", [
  "warranty",
  "receipt",
  "insurance",
  "other",
])

/** Always-private files (warranty/receipt/insurance) linked to a UserWatch. */
export const documents = pgTable("documents", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  userWatchId: text("user_watch_id")
    .notNull()
    .references(() => userWatches.id, { onDelete: "cascade" }),
  docType: documentTypeEnum("doc_type").notNull().default("other"),
  fileName: text("file_name").notNull(),
  storageKey: text("storage_key").notNull(),
  contentType: text("content_type"),
  size: integer("size"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

export type WatchDocument = typeof documents.$inferSelect
export type NewWatchDocument = typeof documents.$inferInsert
