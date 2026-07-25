"use server"

import bcrypt from "bcryptjs"
import { eq } from "drizzle-orm"
import { after } from "next/server"
import { getLocale } from "next-intl/server"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { redirect } from "@/i18n/navigation"
import {
  ForgotPasswordSchema,
  RegisterSchema,
  ResetPasswordSchema,
  type ActionState,
} from "@/lib/definitions"
import { issueToken, redeemToken } from "./tokens"
import {
  checkRateLimit,
  getClientIp,
} from "./rate-limit"
import {
  sendResetPasswordEmail,
  sendVerificationEmail,
} from "@/lib/email/mailer"

export async function register(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const raw = {
    name: formData.get("name"),
    username: formData.get("username"),
    email: formData.get("email"),
    password: formData.get("password"),
  }

  const result = RegisterSchema.safeParse(raw)
  if (!result.success) {
    return { errors: result.error.flatten().fieldErrors }
  }

  // Rate limit registration per IP to blunt automated signup abuse.
  const ip = await getClientIp()
  const rl = await checkRateLimit("register", ip)
  if (!rl.success) {
    return { message: "Too many attempts. Please try again later." }
  }

  const { name, username, email, password } = result.data

  const [existingEmail] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1)

  if (existingEmail) {
    return { errors: { email: ["An account with this email already exists."] } }
  }

  const [existingUsername] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, username))
    .limit(1)

  if (existingUsername) {
    return { errors: { username: ["This username is already taken."] } }
  }

  const passwordHash = await bcrypt.hash(password, 12)

  // New signups start unverified (email_verified NULL) — ADR 0007 hard gate.
  const [created] = await db
    .insert(users)
    .values({ name, username, email, passwordHash })
    .returning({ id: users.id })

  const locale = await getLocale()
  const token = await issueToken(created!.id, "email_verification")
  await sendVerificationEmail({
    to: email,
    name,
    token,
    locale,
    userId: created!.id,
  })

  redirect({
    href: { pathname: "/login", query: { verify: "sent" } },
    locale,
  })
}

/**
 * Forgot-password: always returns the same generic success (ADR 0007 — no
 * enumeration). Only sends a reset email when the account actually exists.
 */
export async function forgotPassword(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const result = ForgotPasswordSchema.safeParse({ email: formData.get("email") })
  if (!result.success) {
    return { errors: result.error.flatten().fieldErrors }
  }
  const { email } = result.data

  // Rate limit by IP and by email to blunt abuse / email bombing.
  const ip = await getClientIp()
  const [ipOk, emailOk] = await Promise.all([
    checkRateLimit("forgotPassword", `ip:${ip}`),
    checkRateLimit("forgotPassword", `email:${email}`),
  ])
  // Generic response regardless — never reveal the rate-limit state either.
  if (!ipOk.success || !emailOk.success) {
    return { message: "SENT" }
  }

  const locale = await getLocale()

  // Do the lookup + token + send AFTER the response is flushed (MED-2): response
  // timing is then identical whether or not the account exists, so it can't be
  // used as an existence oracle alongside the intentionally-generic body.
  after(async () => {
    const [user] = await db
      .select({ id: users.id, name: users.name })
      .from(users)
      .where(eq(users.email, email))
      .limit(1)
    if (!user) return
    const token = await issueToken(user.id, "password_reset")
    await sendResetPasswordEmail({
      to: email,
      name: user.name,
      token,
      locale,
      userId: user.id,
    })
  })

  return { message: "SENT" }
}

/**
 * Reset-password: redeems a single-use token, sets the new password, and stamps
 * `passwordChangedAt` so every existing session is invalidated (ADR 0008).
 */
export async function resetPassword(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const result = ResetPasswordSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
  })
  if (!result.success) {
    return { errors: result.error.flatten().fieldErrors }
  }
  const { token, password } = result.data

  const redeemed = await redeemToken(token, "password_reset")
  if (!redeemed) {
    return { message: "INVALID_TOKEN" }
  }

  const passwordHash = await bcrypt.hash(password, 12)
  await db
    .update(users)
    .set({ passwordHash, passwordChangedAt: new Date() })
    .where(eq(users.id, redeemed.userId))

  redirect({
    href: { pathname: "/login", query: { reset: "ok" } },
    locale: await getLocale(),
  })
}

/**
 * Resend verification: generic success (ADR 0007 — no enumeration). Only sends
 * when an unverified account matches. Rate limited per email.
 */
export async function resendVerification(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const result = ForgotPasswordSchema.safeParse({ email: formData.get("email") })
  if (!result.success) {
    return { errors: result.error.flatten().fieldErrors }
  }
  const { email } = result.data

  // Limit by IP and by email (LOW-1: IP limiter added).
  const ip = await getClientIp()
  const [ipOk, emailOk] = await Promise.all([
    checkRateLimit("resendVerification", `ip:${ip}`),
    checkRateLimit("resendVerification", `email:${email}`),
  ])
  if (!ipOk.success || !emailOk.success) {
    return { message: "SENT" }
  }

  const locale = await getLocale()

  after(async () => {
    const [user] = await db
      .select({
        id: users.id,
        name: users.name,
        emailVerified: users.emailVerified,
      })
      .from(users)
      .where(eq(users.email, email))
      .limit(1)
    if (!user || user.emailVerified) return
    const token = await issueToken(user.id, "email_verification")
    await sendVerificationEmail({
      to: email,
      name: user.name,
      token,
      locale,
      userId: user.id,
    })
  })

  return { message: "SENT" }
}

/**
 * Verify email: redeems a single-use token and stamps `emailVerified`. Returns a
 * status the page renders (success / invalid / already-verified). Called from the
 * /verify-email route.
 */
export async function verifyEmail(
  token: string
): Promise<"verified" | "invalid"> {
  const redeemed = await redeemToken(token, "email_verification")
  if (!redeemed) return "invalid"

  await db
    .update(users)
    .set({ emailVerified: new Date() })
    .where(eq(users.id, redeemed.userId))

  return "verified"
}
