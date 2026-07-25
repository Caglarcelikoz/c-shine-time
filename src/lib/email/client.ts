import "server-only"
import { Resend } from "resend"
import type { ReactElement } from "react"

const apiKey = process.env.RESEND_API_KEY
const from = process.env.EMAIL_FROM ?? "C-Shine Time <onboarding@resend.dev>"

const resend = apiKey ? new Resend(apiKey) : null

export async function sendEmail(opts: {
  to: string
  subject: string
  react: ReactElement
  idempotencyKey?: string
}): Promise<{ sent: boolean }> {
  if (!resend) {
    console.warn(
      `[email] RESEND_API_KEY unset — skipping "${opts.subject}" to ${opts.to}`
    )
    return { sent: false }
  }

  const { error } = await resend.emails.send(
    { from, to: [opts.to], subject: opts.subject, react: opts.react },
    opts.idempotencyKey ? { idempotencyKey: opts.idempotencyKey } : undefined
  )

  if (error) {
    console.error(`[email] send failed: ${error.message}`)
    return { sent: false }
  }
  return { sent: true }
}
