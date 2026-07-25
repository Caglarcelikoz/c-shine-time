import { index, pgTable, text, timestamp } from "drizzle-orm/pg-core"
import { createId } from "@paralleldrive/cuid2"
import { authTokenTypeEnum } from "./enums"
import { users } from "./user"

export const authTokens = pgTable(
  "auth_tokens",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: authTokenTypeEnum("type").notNull(),
    tokenHash: text("token_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("auth_tokens_token_hash_idx").on(table.tokenHash),
    index("auth_tokens_user_type_idx").on(table.userId, table.type),
  ]
)

export type AuthToken = typeof authTokens.$inferSelect
export type NewAuthToken = typeof authTokens.$inferInsert
