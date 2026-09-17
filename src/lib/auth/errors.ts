/**
 * Auth error sentinels surfaced via NextAuth `result.error`. Kept in a
 * dependency-free module so client components (the login page) can import them
 * without pulling server-only code (rate-limit / next/headers) into the bundle.
 */

/** Credentials correct but the account's email is unverified. */
export const EMAIL_UNVERIFIED_ERROR = "EMAIL_UNVERIFIED"

/** Login rate limit exceeded. */
export const RATE_LIMITED_ERROR = "RATE_LIMITED"

/** Login couldn't be evaluated (rate-limit backend or database unreachable).
 *  Distinct from bad credentials: telling a user their password is wrong when
 *  the real fault is infrastructure sends them resetting a password that works. */
export const SERVICE_UNAVAILABLE_ERROR = "SERVICE_UNAVAILABLE"
