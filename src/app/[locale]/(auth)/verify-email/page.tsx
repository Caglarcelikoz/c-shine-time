"use client"

import { Suspense, useState, useTransition } from "react"
import { useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { Link } from "@/i18n/navigation"
import { Button } from "@/components/ui/button"
import { verifyEmail } from "@/lib/auth/actions"

type Status = "idle" | "verified" | "invalid"

function VerifyEmailInner() {
  const t = useTranslations("Auth")
  const searchParams = useSearchParams()
  const token = searchParams.get("token") ?? ""

  const [status, setStatus] = useState<Status>(token ? "idle" : "invalid")
  const [pending, startTransition] = useTransition()

  function handleConfirm() {
    startTransition(async () => {
      setStatus(await verifyEmail(token))
    })
  }

  return (
    <div className="w-full max-w-sm text-center">
      <h1 className="font-serif text-3xl font-medium mb-4">
        {t("verifyEmailTitle")}
      </h1>

      {status === "idle" && (
        <>
          <p className="text-sm text-muted-foreground mb-6">
            {t("verifyConfirmPrompt")}
          </p>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={pending}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {pending ? t("verifying") : t("confirmEmail")}
          </Button>
        </>
      )}

      {status === "verified" && (
        <>
          <div className="px-4 py-4 rounded-sm border border-primary/30 bg-primary/5 text-sm text-foreground">
            {t("verifySuccess")}
          </div>
          <p className="mt-6 text-sm text-muted-foreground">
            <Link
              href="/login"
              className="text-foreground underline underline-offset-2 hover:text-primary transition-colors"
            >
              {t("continueToSignIn")}
            </Link>
          </p>
        </>
      )}

      {status === "invalid" && (
        <>
          <p className="text-sm text-destructive">{t("verifyInvalid")}</p>
          <p className="mt-6 text-sm text-muted-foreground">
            <Link
              href="/login"
              className="text-foreground underline underline-offset-2 hover:text-primary transition-colors"
            >
              {t("backToSignIn")}
            </Link>
          </p>
        </>
      )}
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailInner />
    </Suspense>
  )
}
