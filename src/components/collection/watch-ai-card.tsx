"use client"

import { useState, useTransition } from "react"
import { useTranslations } from "next-intl"
import { analyzeWatch } from "@/lib/ai/actions"

export function WatchAiCard({ watchId }: { watchId: string }) {
  const t = useTranslations("CollectionDetail")
  const [message, setMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function analyze() {
    startTransition(async () => {
      const result = await analyzeWatch(watchId)
      setMessage(result.message)
    })
  }

  return (
    <div className="rounded-sm border border-border bg-card p-6">
      <div className="flex items-center justify-between mb-3">
        <p className="label-gold-caps">{t("aiAnalysis")}</p>
        {message && !isPending && (
          <button
            onClick={analyze}
            className="label-caps hover:text-foreground transition-colors"
          >
            {t("refresh")}
          </button>
        )}
      </div>

      {message ? (
        <p className="text-sm leading-relaxed text-foreground">{message}</p>
      ) : (
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            {t("aiAnalysisHint")}
          </p>
          <button
            onClick={analyze}
            disabled={isPending}
            className="shrink-0 px-5 py-2.5 bg-primary text-primary-foreground text-[10px] tracking-[0.18em] uppercase font-sans rounded-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {isPending ? t("analyzing") : t("analyze")}
          </button>
        </div>
      )}
    </div>
  )
}
