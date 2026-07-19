"use client"

import { useState, useTransition } from "react"
import { useTranslations } from "next-intl"
import { CheckIcon, SparklesIcon } from "lucide-react"
import { updateFeaturedPiece } from "@/lib/settings/actions"

/** One selectable public owned watch in the picker. */
export interface FeaturedOption {
  id: string
  brand: string
  model: string
  imageUrl: string | null
}

/**
 * ADR 0006 — pick the featured piece. A horizontally scrollable row: the first
 * card is "Automatic (newest)" (clears the choice → null), the rest are the
 * owner's public owned watches. Saves on click, like the other settings
 * controls; `active === null` means automatic.
 */
export function FeaturedPicker({
  options,
  initial,
}: {
  options: FeaturedOption[]
  initial: string | null
}) {
  const t = useTranslations("Settings")
  // A stored id that's no longer a candidate reads as automatic in the picker,
  // matching how the profile resolves it.
  const validInitial =
    initial && options.some((o) => o.id === initial) ? initial : null
  const [active, setActive] = useState<string | null>(validInitial)
  const [, startTransition] = useTransition()

  function pick(watchId: string | null) {
    setActive(watchId)
    startTransition(() => {
      updateFeaturedPiece(watchId)
    })
  }

  const cardBase =
    "relative shrink-0 w-32 rounded-sm border text-left transition-colors overflow-hidden"
  const cardActive = "border-primary ring-1 ring-primary/40"
  const cardIdle = "border-border hover:border-primary/40"

  return (
    <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x">
      {/* Automatic card */}
      <button
        type="button"
        onClick={() => pick(null)}
        className={`${cardBase} snap-start ${active === null ? cardActive : cardIdle}`}
      >
        <div className="h-32 w-full flex items-center justify-center bg-secondary">
          <SparklesIcon className="size-6 text-primary/60" />
        </div>
        {active === null && <ActiveCheck />}
        <div className="p-2.5">
          <p className="text-[10px] font-sans tracking-widest uppercase text-foreground">
            {t("featuredAutomatic")}
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">
            {t("featuredAutomaticHint")}
          </p>
        </div>
      </button>

      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => pick(o.id)}
          className={`${cardBase} snap-start ${active === o.id ? cardActive : cardIdle}`}
        >
          <div className="h-32 w-full overflow-hidden bg-secondary">
            {o.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={o.imageUrl}
                alt={`${o.brand} ${o.model}`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="w-8 h-8 rounded-full border border-border/40 opacity-30" />
              </div>
            )}
          </div>
          {active === o.id && <ActiveCheck />}
          <div className="p-2.5">
            <p className="text-[10px] font-sans tracking-widest uppercase text-muted-foreground">
              {o.brand}
            </p>
            <p className="text-xs font-serif leading-tight text-foreground truncate">
              {o.model}
            </p>
          </div>
        </button>
      ))}
    </div>
  )
}

function ActiveCheck() {
  return (
    <div className="absolute top-1.5 right-1.5 rounded-full bg-primary text-primary-foreground p-1">
      <CheckIcon className="size-3.5" />
    </div>
  )
}
