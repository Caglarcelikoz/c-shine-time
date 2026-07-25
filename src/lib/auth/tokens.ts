import "server-only"
import { randomBytes, createHash } from "node:crypto"
import { and, eq, gt, isNull } from "drizzle-orm"
import { db } from "@/lib/db"
import { authTokens } from "@/lib/db/schema"

export type AuthTokenType = "password_reset" | "email_verification"

const TTL_MS: Record<AuthTokenType, number> = {
  password_reset: 30 * 60 * 1000, //   30 minutes
  email_verification: 24 * 60 * 60 * 1000, // 24 hours
}

/** SHA-256 hex of the raw token. Deterministic → safe to look up by. */
function hashToken(rawToken: string): string {
  return createHash("sha256").update(rawToken).digest("hex")
}

/**
 * Issue a token for `userId`. Invalidates the user's existing unused tokens of the
 * same type (marks them used), then inserts a fresh hashed row. Returns the RAW
 * token — the only place it ever exists in plaintext; embed it in the email link
 * and never log or persist it.
 */
export async function issueToken(
  userId: string,
  type: AuthTokenType
): Promise<string> {
  const rawToken = randomBytes(32).toString("base64url")
  const tokenHash = hashToken(rawToken)
  const expiresAt = new Date(Date.now() + TTL_MS[type])

  // Invalidate prior unused tokens of this type so an older link can't be replayed.
  await db
    .update(authTokens)
    .set({ usedAt: new Date() })
    .where(
      and(
        eq(authTokens.userId, userId),
        eq(authTokens.type, type),
        isNull(authTokens.usedAt)
      )
    )

  await db.insert(authTokens).values({ userId, type, tokenHash, expiresAt })

  return rawToken
}

/**
 * Redeem a raw token: valid only if it exists, matches the type, is unused, and is
 * unexpired. On success stamps `usedAt` (single-use) and returns the owning userId.
 * Returns null for any invalid/expired/used/wrong-type token — callers must not
 * distinguish the reasons to the client.
 */
export async function redeemToken(
  rawToken: string,
  type: AuthTokenType
): Promise<{ userId: string } | null> {
  if (!rawToken) return null
  const tokenHash = hashToken(rawToken)

  const [row] = await db
    .select()
    .from(authTokens)
    .where(
      and(
        eq(authTokens.tokenHash, tokenHash),
        eq(authTokens.type, type),
        isNull(authTokens.usedAt),
        gt(authTokens.expiresAt, new Date())
      )
    )
    .limit(1)

  if (!row) return null

  // Single-use: atomically claim it. If another concurrent request already used it,
  // the guarded UPDATE affects 0 rows and we reject.
  const claimed = await db
    .update(authTokens)
    .set({ usedAt: new Date() })
    .where(and(eq(authTokens.id, row.id), isNull(authTokens.usedAt)))
    .returning({ id: authTokens.id })

  if (claimed.length === 0) return null

  return { userId: row.userId }
}
