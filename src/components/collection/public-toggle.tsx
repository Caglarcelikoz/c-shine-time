"use client"

import { useState, useTransition } from "react"
import { useTranslations } from "next-intl"
import { setWatchPublic } from "@/lib/collection/actions"

export function PublicToggle({ id, initial }: { id: string; initial: boolean }) {
  const t = useTranslations("CollectionDetail")
  const [on, setOn] = useState(initial)
  const [, startTransition] = useTransition()

  function toggle() {
    const next = !on
    setOn(next)
    startTransition(() => setWatchPublic(id, next))
  }

  return (
    <div className="flex items-center justify-between gap-6 rounded-sm border border-border bg-card p-5">
      <div>
        <p className="text-sm text-foreground">
          {on ? t("publicOnProfile") : t("privateToYou")}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {t("publicToggleHint")}
        </p>
      </div>
      <button
        role="switch"
        aria-checked={on}
        aria-label={t("showOnPublicProfile")}
        onClick={toggle}
        className={[
          "w-11 h-6 rounded-full border relative transition-colors shrink-0",
          on ? "bg-primary/30 border-primary/50" : "bg-secondary border-border",
        ].join(" ")}
      >
        <span
          className={[
            "absolute top-0.5 w-4 h-4 rounded-full transition-transform",
            on ? "translate-x-[22px] bg-primary" : "translate-x-0.5 bg-muted-foreground",
          ].join(" ")}
        />
      </button>
    </div>
  )
}
