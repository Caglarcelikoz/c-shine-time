"use client"

import { useState, useTransition } from "react"
import { useTranslations } from "next-intl"
import { runAdvisor } from "@/lib/ai/actions"

export function WishlistPrioritizer() {
  const t = useTranslations("Wishlist")
  const [message, setMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function prioritize() {
    startTransition(async () => {
      const res = await runAdvisor("prioritize_wishlist")
      setMessage(res.message)
    })
  }

  return (
    <div className="rounded-sm border border-border bg-card p-5 flex items-start gap-5">
      <div className="flex-1">
        <p className="label-gold-caps mb-2 flex items-center gap-2">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary" />
          {t("prioritizerTitle")}
        </p>
        {message ? (
          <p className="font-sans text-sm leading-relaxed text-foreground">
            {message}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            {t("prioritizerBody")}
          </p>
        )}
      </div>
      <button
        onClick={prioritize}
        disabled={isPending}
        className="shrink-0 px-5 py-2.5 border border-primary/40 text-primary text-[10px] tracking-[0.18em] uppercase font-sans rounded-sm hover:bg-primary/10 transition-colors disabled:opacity-50"
      >
        {isPending ? t("thinking") : message ? t("reprioritize") : t("prioritize")}
      </button>
    </div>
  )
}
