"use client"

import { useState, useTransition } from "react"
import { useTranslations } from "next-intl"
import { updatePrivacyToggle } from "@/lib/settings/actions"

type ToggleKey =
  | "publicProfileEnabled"
  | "hideCollectionValue"
  | "hidePurchasePrices"
  | "hideWishlist"
  | "hideSoldArchive"

export function PrivacyToggle({
  keyName,
  label,
  description,
  initial,
}: {
  keyName: ToggleKey
  label: string
  description: string
  initial: boolean
}) {
  const [on, setOn] = useState(initial)
  const [, startTransition] = useTransition()

  function toggle() {
    const next = !on
    setOn(next) // optimistic
    startTransition(() => updatePrivacyToggle(keyName, next))
  }

  return (
    <div className="flex items-center justify-between gap-6 py-5 border-b border-border last:border-0">
      <div>
        <p className="text-sm text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <button
        role="switch"
        aria-checked={on}
        aria-label={label}
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

export function LockedRow({ label, description }: { label: string; description: string }) {
  const t = useTranslations("Settings")
  return (
    <div className="flex items-center justify-between gap-6 py-5 border-b border-border last:border-0">
      <div>
        <p className="text-sm text-foreground flex items-center gap-2">
          {label}
          <span className="label-caps">{t("alwaysPrivate")}</span>
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <span className="label-caps border border-border rounded-sm px-2 py-1">{t("locked")}</span>
    </div>
  )
}
