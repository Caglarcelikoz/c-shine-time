import "server-only"
import { sendEmail } from "./client"
import { VerifyEmail } from "./templates/verify-email"
import { ResetPassword } from "./templates/reset-password"

function baseUrl(): string {
  return (process.env.NEXTAUTH_URL ?? "http://localhost:3000").replace(/\/$/, "")
}

export async function sendVerificationEmail(opts: {
  to: string
  name: string
  token: string
  locale: string
  userId: string
}) {
  const url = `${baseUrl()}/${opts.locale}/verify-email?token=${encodeURIComponent(opts.token)}`
  return sendEmail({
    to: opts.to,
    subject: "Confirm your email — C-Shine Time",
    react: VerifyEmail({ name: opts.name, url }),
    idempotencyKey: `verify-email/${opts.userId}/${Math.floor(Date.now() / 60000)}`,
  })
}

export async function sendResetPasswordEmail(opts: {
  to: string
  name: string
  token: string
  locale: string
  userId: string
}) {
  const url = `${baseUrl()}/${opts.locale}/reset-password?token=${encodeURIComponent(opts.token)}`
  return sendEmail({
    to: opts.to,
    subject: "Reset your password — C-Shine Time",
    react: ResetPassword({ name: opts.name, url }),
    // Per-minute bucket; never embeds token material (LOW-2).
    idempotencyKey: `reset-password/${opts.userId}/${Math.floor(Date.now() / 60000)}`,
  })
}
