"use client"

import { useActionState } from "react"
import { useTranslations } from "next-intl"
import { Link } from "@/i18n/navigation"
import { forgotPassword } from "@/lib/auth/actions"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

export default function ForgotPasswordPage() {
  const t = useTranslations("Auth")
  const [state, action, pending] = useActionState(forgotPassword, undefined)
  const sent = state?.message === "SENT"

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 text-center">
        <h1 className="font-serif text-3xl font-medium mb-2">
          {t("forgotPasswordTitle")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("forgotPasswordSubtitle")}
        </p>
      </div>

      {sent ? (
        <div className="px-4 py-4 rounded-sm border border-primary/30 bg-primary/5 text-sm text-center text-foreground">
          {t("forgotPasswordSent")}
        </div>
      ) : (
        <form action={action} className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="label-caps">
              {t("email")}
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              required
              className="bg-card border-border"
            />
            {state?.errors?.email && (
              <p className="text-xs text-destructive">{state.errors.email[0]}</p>
            )}
          </div>

          <Button
            type="submit"
            disabled={pending}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {pending ? t("sending") : t("sendResetLink")}
          </Button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-muted-foreground">
        <Link
          href="/login"
          className="text-foreground underline underline-offset-2 hover:text-primary transition-colors"
        >
          {t("backToSignIn")}
        </Link>
      </p>
    </div>
  )
}
