"use client"

import { useState, useTransition } from "react"
import { useTranslations } from "next-intl"
import { Link } from "@/i18n/navigation"
import { CameraIcon, CheckIcon, SparklesIcon, XIcon } from "lucide-react"
import { runAdvisor } from "@/lib/ai/actions"
import { dismissOnboarding } from "@/lib/onboarding/actions"

const REQUIRED_WATCHES = 3

interface SetupChecklistProps {
  ownedCount: number
  hasAdvisorRun: boolean
  aiEnabled: boolean
}

/**
 * ADR 0004 — the dashboard setup checklist. All steps derive from live data;
 * the final step runs the first AI insight inline (user-triggered, never
 * auto). Dismissal persists via users.onboardingDismissedAt.
 */
export function SetupChecklist({
  ownedCount,
  hasAdvisorRun,
  aiEnabled,
}: SetupChecklistProps) {
  const t = useTranslations("Onboarding")
  const [insight, setInsight] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [revealing, startReveal] = useTransition()
  const [dismissing, startDismiss] = useTransition()

  const enough = ownedCount >= REQUIRED_WATCHES
  // Step 4 completes locally the moment the insight lands — no refresh, or
  // the server would re-derive "complete" and hide the card mid-reveal. The
  // checklist disappears naturally on the next visit (advisor_runs has a row).
  const insightDone = hasAdvisorRun || insight !== null

  const steps = [
    {
      label: t("step1Label"),
      hint: t("step1Hint"),
      done: ownedCount >= 1,
    },
    {
      label: t("step2Label", { required: REQUIRED_WATCHES }),
      hint: t("step2Hint", { current: Math.min(ownedCount, REQUIRED_WATCHES), required: REQUIRED_WATCHES }),
      done: enough,
    },
    {
      label: t("step3Label"),
      hint: enough ? t("step3HintDone") : t("step3HintPending"),
      done: enough,
    },
    {
      label: t("step4Label"),
      hint: t("step4Hint"),
      done: insightDone,
    },
  ]
  const doneCount = steps.filter((s) => s.done).length

  function reveal() {
    setError(null)
    startReveal(async () => {
      const res = await runAdvisor("find_gaps")
      if (res.error) {
        setError(res.message)
      } else {
        setInsight(res.message)
      }
    })
  }

  return (
    <div className="rounded-sm border border-primary/30 bg-card p-6 relative">
      <button
        type="button"
        disabled={dismissing}
        onClick={() => startDismiss(() => dismissOnboarding())}
        title={t("dismiss")}
        className="absolute top-4 right-4 p-1.5 rounded-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
      >
        <XIcon className="size-4" />
      </button>

      <p className="label-gold-caps mb-1">{t("gettingStarted")}</p>
      <p className="text-sm text-muted-foreground mb-6">
        {t("progress", { done: doneCount, total: steps.length })}
      </p>

      <ol className="space-y-3 mb-6">
        {steps.map((s, i) => (
          <li key={s.label} className="flex items-start gap-3">
            <span
              className={`mt-0.5 flex items-center justify-center w-5 h-5 rounded-full border text-[10px] shrink-0 ${
                s.done
                  ? "border-primary bg-primary/15 text-primary"
                  : "border-border text-muted-foreground"
              }`}
            >
              {s.done ? <CheckIcon className="size-3" /> : i + 1}
            </span>
            <div>
              <p
                className={`text-sm ${
                  s.done ? "text-muted-foreground line-through" : "text-foreground"
                }`}
              >
                {s.label}
              </p>
              {!s.done && (
                <p className="text-xs text-muted-foreground mt-0.5">{s.hint}</p>
              )}
            </div>
          </li>
        ))}
      </ol>

      {/* One CTA at a time: add watches until 3, then reveal the insight. */}
      {!enough ? (
        <Link
          href="/collection/new"
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground text-[10px] tracking-[0.18em] uppercase font-sans rounded-sm hover:bg-primary/90 transition-colors"
        >
          <CameraIcon className="size-4" />
          {ownedCount === 0 ? t("addFirstWatch") : t("addAnotherWatch")}
        </Link>
      ) : !hasAdvisorRun && !insight ? (
        aiEnabled ? (
          <button
            type="button"
            disabled={revealing}
            onClick={reveal}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground text-[10px] tracking-[0.18em] uppercase font-sans rounded-sm hover:bg-primary/90 transition-colors disabled:opacity-60"
          >
            <SparklesIcon className="size-4" />
            {revealing ? t("readingCollection") : t("revealFirstInsight")}
          </button>
        ) : (
          <p className="text-xs text-muted-foreground">
            {t("addApiKeyHint")}
          </p>
        )
      ) : null}

      {insight && (
        <div className="rounded-sm border border-primary/30 bg-primary/5 px-4 py-3 mt-2">
          <p className="label-gold-caps mb-2 flex items-center gap-2">
            <SparklesIcon className="size-3.5" />
            {t("yourFirstInsight")}
          </p>
          <p className="text-sm leading-relaxed text-foreground">{insight}</p>
          <Link
            href="/advisor"
            className="inline-block mt-3 text-[10px] tracking-[0.18em] uppercase font-sans text-primary hover:opacity-80 transition-opacity"
          >
            {t("openAiAdvisor")}
          </Link>
        </div>
      )}
      {error && <p className="text-sm text-destructive mt-2">{error}</p>}
    </div>
  )
}
