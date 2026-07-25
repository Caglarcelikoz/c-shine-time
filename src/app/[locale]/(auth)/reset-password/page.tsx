"use client"

import { Suspense } from "react"
import { useActionState } from "react"
import { useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { Link } from "@/i18n/navigation"
import { resetPassword } from "@/lib/auth/actions"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

function ResetPasswordForm() {
  const t = useTranslations("Auth")
  const searchParams = useSearchParams()
  const token = searchParams.get("token") ?? ""
  const [state, action, pending] = useActionState(resetPassword, undefined)
  const invalidToken = state?.message === "INVALID_TOKEN"

  if (!token) {
    return (
      <div className="w-full max-w-sm text-center">
        <h1 className="font-serif text-3xl font-medium mb-2">
          {t("resetPasswordTitle")}
        </h1>
        <p className="text-sm text-destructive mt-4">{t("resetLinkInvalid")}</p>
        <p className="mt-6 text-sm text-muted-foreground">
          <Link
            href="/forgot-password"
            className="text-foreground underline underline-offset-2 hover:text-primary transition-colors"
          >
            {t("requestNewLink")}
          </Link>
        </p>
      </div>
    )
  }

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 text-center">
        <h1 className="font-serif text-3xl font-medium mb-2">
          {t("resetPasswordTitle")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("resetPasswordSubtitle")}
        </p>
      </div>

      <form action={action} className="space-y-5">
        <input type="hidden" name="token" value={token} />
        <div className="space-y-1.5">
          <Label htmlFor="password" className="label-caps">
            {t("newPassword")}
          </Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder={t("passwordPlaceholder")}
            required
            className="bg-card border-border"
          />
          {state?.errors?.password && (
            <p className="text-xs text-destructive">{state.errors.password[0]}</p>
          )}
        </div>

        {invalidToken && (
          <p className="text-sm text-destructive text-center">
            {t("resetLinkExpired")}{" "}
            <Link
              href="/forgot-password"
              className="underline underline-offset-2 hover:text-primary"
            >
              {t("requestNewLink")}
            </Link>
          </p>
        )}

        <Button
          type="submit"
          disabled={pending}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {pending ? t("resetting") : t("setNewPassword")}
        </Button>
      </form>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  )
}
