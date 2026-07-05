"use client"

import { useState, useTransition } from "react"
import { useTranslations } from "next-intl"
import { deleteWatch } from "@/lib/collection/actions"

export function DeleteWatchButton({ id }: { id: string }) {
  const t = useTranslations("CollectionDetail")
  const [confirming, setConfirming] = useState(false)
  const [isPending, startTransition] = useTransition()

  if (confirming) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-xs text-muted-foreground">{t("deleteConfirm")}</span>
        <button
          onClick={() => startTransition(() => deleteWatch(id))}
          disabled={isPending}
          className="text-[10px] tracking-[0.18em] uppercase font-sans text-destructive hover:opacity-80 transition-opacity"
        >
          {isPending ? t("deleting") : t("yesDelete")}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="text-[10px] tracking-[0.18em] uppercase font-sans text-muted-foreground hover:text-foreground transition-colors"
        >
          {t("cancel")}
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="text-[10px] tracking-[0.18em] uppercase font-sans text-muted-foreground hover:text-destructive transition-colors"
    >
      {t("delete")}
    </button>
  )
}
