"use client"

import { Suspense, useState, useTransition } from "react"
import { signIn } from "next-auth/react"
import { useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { useRouter } from "@/i18n/navigation"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Link } from "@/i18n/navigation"
import { EMAIL_UNVERIFIED_ERROR, RATE_LIMITED_ERROR } from "@/lib/auth/errors"
import { resendVerification } from "@/lib/auth/actions"

function LoginForm() {
  const t = useTranslations("Auth")
  const router = useRouter()
  const searchParams = useSearchParams()
  const registered = searchParams.get("registered")
  const verifySent = searchParams.get("verify") === "sent"
  const resetOk = searchParams.get("reset") === "ok"
  const [error, setError] = useState<string | null>(null)
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null)
  const [resent, setResent] = useState(false)
  const [isPending, startTransition] = useTransition()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setUnverifiedEmail(null)
    setResent(false)

    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    startTransition(async () => {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (result?.error === EMAIL_UNVERIFIED_ERROR) {
        setUnverifiedEmail(email)
      } else if (result?.error === RATE_LIMITED_ERROR) {
        setError(t("tooManyAttempts"))
      } else if (result?.error) {
        setError(t("invalidCredentials"))
      } else {
        router.push("/dashboard")
        router.refresh()
      }
    })
  }

  async function handleResend() {
    if (!unverifiedEmail) return
    const fd = new FormData()
    fd.set("email", unverifiedEmail)
    await resendVerification(undefined, fd)
    setResent(true)
  }

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 text-center">
        <h1 className="font-serif text-3xl font-medium mb-2">{t("welcomeBack")}</h1>
        <p className="text-sm text-muted-foreground">{t("signInToCollection")}</p>
      </div>

      {registered && (
        <div className="mb-5 px-4 py-3 rounded-sm border border-primary/30 bg-primary/5 text-sm text-primary text-center">
          {t("accountCreated")}
        </div>
      )}

      {verifySent && (
        <div className="mb-5 px-4 py-3 rounded-sm border border-primary/30 bg-primary/5 text-sm text-primary text-center">
          {t("verifyEmailSent")}
        </div>
      )}

      {resetOk && (
        <div className="mb-5 px-4 py-3 rounded-sm border border-primary/30 bg-primary/5 text-sm text-primary text-center">
          {t("passwordResetOk")}
        </div>
      )}

      {unverifiedEmail ? (
        <div className="mb-5 px-4 py-4 rounded-sm border border-amber-500/30 bg-amber-500/5 text-sm text-center space-y-3">
          <p className="text-foreground">{t("verifyRequired")}</p>
          {resent ? (
            <p className="text-muted-foreground">{t("verifyResent")}</p>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={handleResend}
              className="w-full"
            >
              {t("resendVerification")}
            </Button>
          )}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="email" className="label-caps">{t("email")}</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            required
            className="bg-card border-border"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="label-caps">{t("password")}</Label>
            <Link
              href="/forgot-password"
              className="text-xs text-muted-foreground underline underline-offset-2 hover:text-primary transition-colors"
            >
              {t("forgotPassword")}
            </Link>
          </div>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            required
            className="bg-card border-border"
          />
        </div>

        {error && (
          <p className="text-sm text-destructive text-center">{error}</p>
        )}

        <Button
          type="submit"
          disabled={isPending}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {isPending ? t("signingIn") : t("signIn")}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {t("dontHaveAccount")}{" "}
        <Link
          href="/register"
          className="text-foreground underline underline-offset-2 hover:text-primary transition-colors"
        >
          {t("createOne")}
        </Link>
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
