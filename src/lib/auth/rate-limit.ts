import "server-only"
import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"
import { headers } from "next/headers"
import { clientIpFromHeaders } from "./ip"

/**
 * Serverless-native rate limiting. Backed by Upstash Redis so counters
 * are shared across invocations. Fails OPEN when Upstash env vars are unset
 */

const enabled =
  !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN

const redis = enabled ? Redis.fromEnv() : null

function makeLimiter(tokens: number, window: `${number} ${"s" | "m" | "h"}`, prefix: string) {
  if (!redis) return null
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(tokens, window),
    prefix: `ratelimit:${prefix}`,
    analytics: false,
  })
}

// Per-flow limiters. Login/forgot are keyed by both IP and email at the call site.
const limiters = {
  login: makeLimiter(5, "5 m", "login"), //         5 attempts / 5 min
  forgotPassword: makeLimiter(3, "15 m", "forgot"), // 3 / 15 min
  register: makeLimiter(5, "1 h", "register"), //     5 / hour per IP
  resendVerification: makeLimiter(3, "15 m", "resend"), // 3 / 15 min
} as const

export type RateLimitAction = keyof typeof limiters

/** Best-effort client IP from proxy headers. Falls back to "unknown". */
export async function getClientIp(): Promise<string> {
  return clientIpFromHeaders(await headers())
}

/**
 * Consume one token for `action` under `identifier`. Returns `{ success }`. When
 * rate limiting is disabled (no Upstash env), always succeeds (fail-open).
 */
export async function checkRateLimit(
  action: RateLimitAction,
  identifier: string
): Promise<{ success: boolean; retryAfterSeconds?: number }> {
  const limiter = limiters[action]
  if (!limiter) return { success: true }

  const { success, reset } = await limiter.limit(identifier)
  if (success) return { success: true }

  const retryAfterSeconds = Math.max(1, Math.ceil((reset - Date.now()) / 1000))
  return { success: false, retryAfterSeconds }
}
