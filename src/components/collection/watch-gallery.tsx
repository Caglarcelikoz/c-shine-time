"use client"

import { useState, useTransition } from "react"
import { StarIcon } from "lucide-react"
import { setPrimaryImage } from "@/lib/collection/actions"

interface WatchGalleryProps {
  userWatchId: string
  urls: string[]
  alt: string
}

/**
 * Photo gallery (ADR 0003) — main image + thumbnail strip. imageUrls[0] is
 * the primary shown everywhere else (cards, compare, PDF, public profile);
 * "make primary" reorders the stored array via a server action.
 */
export function WatchGallery({ userWatchId, urls, alt }: WatchGalleryProps) {
  const [selected, setSelected] = useState(0)
  const [pending, startTransition] = useTransition()

  if (urls.length === 0) {
    return (
      <div className="relative aspect-square rounded-sm overflow-hidden border border-border bg-secondary">
        <div className="w-full h-full flex items-center justify-center">
          <div className="w-16 h-16 rounded-full border border-border/40 opacity-30" />
        </div>
      </div>
    )
  }

  const current = urls[Math.min(selected, urls.length - 1)]
  const isPrimary = current === urls[0]

  return (
    <div className="space-y-3">
      <div className="relative aspect-square rounded-sm overflow-hidden border border-border bg-secondary">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={current} alt={alt} className="w-full h-full object-cover" />
        {!isPrimary && (
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                await setPrimaryImage(userWatchId, current)
                setSelected(0)
              })
            }
            className="absolute bottom-3 right-3 inline-flex items-center gap-2 px-3 py-2 rounded-sm bg-background/85 backdrop-blur-sm border border-border text-[10px] tracking-[0.18em] uppercase font-sans text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors disabled:opacity-60"
          >
            <StarIcon className="size-3.5" />
            {pending ? "Saving…" : "Make primary"}
          </button>
        )}
      </div>

      {urls.length > 1 && (
        <div className="flex gap-2">
          {urls.map((u, i) => (
            <button
              key={u}
              type="button"
              onClick={() => setSelected(i)}
              className={`relative w-16 h-16 rounded-sm border overflow-hidden transition-colors ${
                i === selected
                  ? "border-primary"
                  : "border-border hover:border-foreground/30"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={u} alt="" className="w-full h-full object-cover" />
              {i === 0 && (
                <span className="absolute bottom-0 inset-x-0 bg-background/85 text-primary text-[8px] tracking-widest uppercase text-center">
                  1st
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
