"use client"

import { useMemo, useState } from "react"
import { useTranslations } from "next-intl"
import { WatchCard, WatchRow } from "./watch-card"
import { PRIMARY_STYLES } from "@/lib/types"
import type { CollectionItem, PrimaryStyle, WatchStatus } from "@/lib/types"

type StatusFilter = "all" | WatchStatus
type StyleFilter = "all" | PrimaryStyle
type ViewMode = "grid" | "list" | "sections"

const STATUS_ORDER: WatchStatus[] = ["owned", "wishlist", "sold", "grail"]

function chipCls(active: boolean) {
  return [
    "px-3 py-1.5 rounded-sm text-[11px] tracking-widest uppercase font-sans border transition-colors",
    active
      ? "border-primary text-primary bg-primary/5"
      : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30",
  ].join(" ")
}

export function CollectionView({ items }: { items: CollectionItem[] }) {
  const t = useTranslations("Collection")
  const tLabels = useTranslations("Labels")
  const [status, setStatus] = useState<StatusFilter>("all")
  const [style, setStyle] = useState<StyleFilter>("all")
  const [view, setView] = useState<ViewMode>("grid")

  // Which statuses / styles actually appear, so we never show a dead filter.
  const presentStatuses = useMemo(
    () => STATUS_ORDER.filter((s) => items.some((i) => i.status === s)),
    [items]
  )
  const presentStyles = useMemo(
    () => PRIMARY_STYLES.filter((s) => items.some((i) => i.primaryStyle === s)),
    [items]
  )

  const filtered = useMemo(
    () =>
      items.filter(
        (i) =>
          (status === "all" || i.status === status) &&
          (style === "all" || i.primaryStyle === style)
      ),
    [items, status, style]
  )

  const sections = useMemo(() => {
    if (view !== "sections") return []
    return presentStyles
      .map((s) => ({
        style: s,
        items: filtered.filter((i) => i.primaryStyle === s),
      }))
      .filter((sec) => sec.items.length > 0)
  }, [view, presentStyles, filtered])

  if (items.length === 0) {
    return (
      <div className="rounded-sm border border-border bg-card p-12 text-center">
        <p className="font-serif text-2xl mb-2">{t("emptyTitle")}</p>
        <p className="text-muted-foreground text-sm">{t("emptyBody")}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters + view toggle */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => setStatus("all")} className={chipCls(status === "all")}>
            {t("all")}
          </button>
          {presentStatuses.map((s) => (
            <button key={s} onClick={() => setStatus(s)} className={chipCls(status === s)}>
              {tLabels(`watchStatus.${s}`)}
            </button>
          ))}
          <span className="w-px h-5 bg-border mx-1" />
          <button onClick={() => setStyle("all")} className={chipCls(style === "all")}>
            {t("allStyles")}
          </button>
          {presentStyles.map((s) => (
            <button key={s} onClick={() => setStyle(s)} className={chipCls(style === s)}>
              {tLabels(`primaryStyle.${s}`)}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <p className="label-caps">
            {t("showingCount", { shown: filtered.length, total: items.length })}
          </p>
          <div className="flex items-center gap-1">
            {(["grid", "list", "sections"] as ViewMode[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={[
                  "px-3 py-1.5 rounded-sm text-[11px] tracking-widest uppercase font-sans transition-colors",
                  view === v ? "text-primary" : "text-muted-foreground hover:text-foreground",
                ].join(" ")}
              >
                {t(`view.${v}`)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Empty filtered state */}
      {filtered.length === 0 ? (
        <div className="rounded-sm border border-border bg-card p-10 text-center text-muted-foreground text-sm">
          {t("noMatches")}
        </div>
      ) : view === "grid" ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {filtered.map((item) => (
            <WatchCard key={item.id} item={item} />
          ))}
        </div>
      ) : view === "list" ? (
        <div className="space-y-2">
          {filtered.map((item) => (
            <WatchRow key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <div className="space-y-12">
          {sections.map((sec) => (
            <div key={sec.style}>
              <div className="flex items-baseline justify-between mb-4 pb-2 border-b border-border">
                <h2 className="font-serif text-2xl">
                  {tLabels(`primaryStyle.${sec.style}`)}
                </h2>
                <span className="label-caps">
                  {t("pieceCount", { count: sec.items.length })}
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {sec.items.map((item) => (
                  <WatchCard key={item.id} item={item} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
