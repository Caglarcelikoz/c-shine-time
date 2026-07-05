"use client"

import { useState, useTransition } from "react"
import { useTranslations } from "next-intl"
import { Link } from "@/i18n/navigation"
import { updateWishlistHorizon } from "@/lib/collection/actions"
import { TIME_HORIZONS } from "@/lib/types"
import type { CollectionItem, TimeHorizon } from "@/lib/types"
import { formatMoney } from "@/lib/currency"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export interface WishlistEntry {
  item: CollectionItem
  fitScore: number
}

function horizonOf(item: CollectionItem): TimeHorizon {
  return (item.timeHorizon as TimeHorizon | null) ?? "mid"
}

function Card({
  entry,
  onMove,
}: {
  entry: WishlistEntry
  onMove: (id: string, horizon: TimeHorizon) => void
}) {
  const t = useTranslations("Wishlist")
  const tLabels = useTranslations("Labels")
  const { item, fitScore } = entry
  const img = item.watch.imageUrls?.[0]
  const price = formatMoney(item.targetPrice ?? item.marketValueEstimate, item.currency)
  const current = horizonOf(item)

  return (
    <div
      draggable
      onDragStart={(e) => e.dataTransfer.setData("text/plain", item.id)}
      className="rounded-sm border border-border bg-card overflow-hidden hover:border-foreground/20 transition-colors"
    >
      <Link href={`/collection/${item.id}`} className="block cursor-pointer">
        <div className="aspect-[4/3] bg-secondary relative overflow-hidden">
          {img ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={img} alt={`${item.watch.brand} ${item.watch.model}`} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-10 h-10 rounded-full border border-border/40 opacity-30" />
            </div>
          )}
        </div>
        <div className="px-4 pt-4">
          <p className="label-caps">{item.watch.brand}</p>
          <p className="font-serif text-base text-foreground leading-tight">{item.watch.model}</p>
          {item.wishlistReason && (
            <p className="text-xs italic text-muted-foreground mt-2 leading-snug">
              &ldquo;{item.wishlistReason}&rdquo;
            </p>
          )}
        </div>
      </Link>

      {/* Footer — interactive controls live OUTSIDE the link */}
      <div className="px-4 pb-4 pt-3">
        <div className="flex items-center justify-between">
          <span className="label-caps">
            {item.wishlistStatusLabel ? tLabels(`wishlistStatus.${item.wishlistStatusLabel}`) : ""}
          </span>
          {price && <span className="text-xs text-muted-foreground">{price}</span>}
        </div>
        <div className="flex items-center gap-2 mt-2">
          <div className="flex-1 h-px bg-border relative">
            <div
              className="absolute top-1/2 -translate-y-1/2 h-[3px] bg-primary/60 rounded-full"
              style={{ width: `${fitScore}%` }}
            />
          </div>
          <span className="text-[10px] text-muted-foreground">{t("fit", { score: fitScore })}</span>
        </div>

        {/* Move-to control — works on touch/keyboard where drag doesn't */}
        <div className="mt-3 flex items-center gap-2">
          <span className="label-caps shrink-0">{t("moveTo")}</span>
          <Select
            value={current}
            onValueChange={(v) => onMove(item.id, v as TimeHorizon)}
          >
            <SelectTrigger
              onPointerDown={(e) => e.stopPropagation()}
              className="flex-1 h-8 bg-background border-border text-xs"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIME_HORIZONS.map((h) => (
                <SelectItem key={h} value={h} className="text-xs">
                  {tLabels(`timeHorizon.${h}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}

export function WishlistBoard({ entries }: { entries: WishlistEntry[] }) {
  const t = useTranslations("Wishlist")
  const tLabels = useTranslations("Labels")
  const [items, setItems] = useState(entries)
  const [, startTransition] = useTransition()
  const [overCol, setOverCol] = useState<TimeHorizon | null>(null)

  function moveItem(id: string, horizon: TimeHorizon) {
    const entry = items.find((x) => x.item.id === id)
    if (!entry || horizonOf(entry.item) === horizon) return
    setItems((prev) =>
      prev.map((x) =>
        x.item.id === id ? { ...x, item: { ...x.item, timeHorizon: horizon } } : x
      )
    )
    startTransition(() => updateWishlistHorizon(id, horizon))
  }

  function onDrop(horizon: TimeHorizon, e: React.DragEvent) {
    e.preventDefault()
    setOverCol(null)
    const id = e.dataTransfer.getData("text/plain")
    if (id) moveItem(id, horizon)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {TIME_HORIZONS.map((horizon) => {
        const colItems = items.filter((x) => horizonOf(x.item) === horizon)
        return (
          <div
            key={horizon}
            onDragOver={(e) => {
              e.preventDefault()
              setOverCol(horizon)
            }}
            onDragLeave={() => setOverCol((c) => (c === horizon ? null : c))}
            onDrop={(e) => onDrop(horizon, e)}
            className={[
              "rounded-sm p-2 transition-colors min-h-[200px]",
              overCol === horizon ? "bg-primary/5 ring-1 ring-primary/30" : "",
            ].join(" ")}
          >
            <div className="flex items-baseline justify-between px-2 mb-4">
              <div>
                <p className="label-gold-caps">{tLabels(`timeHorizon.${horizon}`)}</p>
                <p className="text-[10px] text-muted-foreground">{tLabels(`timeHorizonSubtitle.${horizon}`)}</p>
              </div>
              <span className="label-caps">{colItems.length}</span>
            </div>

            <div className="space-y-3">
              {colItems.map((entry) => (
                <Card key={entry.item.id} entry={entry} onMove={moveItem} />
              ))}
              <Link
                href="/wishlist/new"
                className="block text-center py-3 rounded-sm border border-dashed border-border text-[10px] tracking-[0.18em] uppercase font-sans text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
              >
                {t("add")}
              </Link>
            </div>
          </div>
        )
      })}
    </div>
  )
}
