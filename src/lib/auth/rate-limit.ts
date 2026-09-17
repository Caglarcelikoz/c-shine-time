import "server-only"
import { and, eq, gte, lt, sql } from "drizzle-orm"
import { headers } from "next/headers"
import { db } from "@/lib/db"
import { rateLimitHits } from "@/lib/db/schema"
import { clientIpFromHeaders } from "./ip"

/**
 * Sliding-window rate limiting backed by the app's own Postgres (ADR 0009).
 *
 * Previously Upstash Redis. Its free-tier database was deleted after 14 idle days
 * and every login broke: the limiter runs before the password check in
 * `authorize`, so an unreachable Redis surfaced as "invalid email or password".
 * Neon suspends an idle compute but never deletes the project, and it is already
 * on the login path for the user lookup — so the limiter can no longer fail
 * independently of the thing it protects.
 *
 * Counting rows is marginally less precise than Redis under simultaneous
 * requests (two can each read a count just below the limit). For auth throttling
 * that is immaterial; it would matter for high-volume quota enforcement.
 */

type WindowUnit = "s" | "m" | "h"

const UNIT_MS: Record<WindowUnit, number> = {
  s: 1000,
  m: 60 * 1000,
  h: 60 * 60 * 1000,
}

type LimiterConfig = { tokens: number; windowMs: number }

function limiter(
  tokens: number,
  window: `${number} ${WindowUnit}`
): LimiterConfig {
  const [amount, unit] = window.split(" ") as [string, WindowUnit]
  return { tokens, windowMs: Number(amount) * UNIT_MS[unit] }
}

// Per-flow limits. Login/forgot are keyed by both IP and email at the call site.
const limiters = {
  login: limiter(5, "5 m"), //               5 attempts / 5 min
  forgotPassword: limiter(3, "15 m"), //     3 / 15 min
  register: limiter(5, "1 h"), //            5 / hour per IP
  resendVerification: limiter(3, "15 m"), // 3 / 15 min
} as const

export type RateLimitAction = keyof typeof limiters

/** Rows expired past this are unreachable by any window, so they can be purged. */
const PURGE_AFTER_MS = 24 * 60 * 60 * 1000

/** Best-effort client IP from proxy headers. Falls back to "unknown". */
export async function getClientIp(): Promise<string> {
  return clientIpFromHeaders(await headers())
}

/**
 * Consume one token for `action` under `identifier`. Returns `{ success }`.
 *
 * Fails CLOSED: if Postgres is unreachable the request is refused rather than
 * silently unthrottled. A caller that reaches its own database afterwards will
 * fail anyway, so this costs no working logins.
 */
export async function checkRateLimit(
  action: RateLimitAction,
  identifier: string
): Promise<{ success: boolean; retryAfterSeconds?: number }> {
  const { tokens, windowMs } = limiters[action]
  const key = `${action}:${identifier}`
  const now = Date.now()
  const windowStart = new Date(now - windowMs)

  try {
    // Opportunistic housekeeping, as `issueToken` does for auth_tokens: drop
    // long-dead rows instead of running a separate cron.
    await db
      .delete(rateLimitHits)
      .where(lt(rateLimitHits.hitAt, new Date(now - PURGE_AFTER_MS)))

    await db.insert(rateLimitHits).values({ key })

    // Count includes the row just inserted, so `> tokens` is the correct test.
    const [row] = await db
      .select({
        count: sql<number>`count(*)::int`,
        oldest: sql<Date | null>`min(${rateLimitHits.hitAt})`,
      })
      .from(rateLimitHits)
      .where(and(eq(rateLimitHits.key, key), gte(rateLimitHits.hitAt, windowStart)))

    const count = row?.count ?? 0
    if (count <= tokens) return { success: true }

    // The window frees a slot when its oldest hit ages out.
    const oldestMs = row?.oldest ? new Date(row.oldest).getTime() : now
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((oldestMs + windowMs - now) / 1000)
    )
    return { success: false, retryAfterSeconds }
  } catch (err) {
    console.error("[rate-limit] backend unreachable — refusing request:", err)
    return { success: false }
  }
}
