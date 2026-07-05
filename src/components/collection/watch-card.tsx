import { useTranslations } from "next-intl"
import { Link } from "@/i18n/navigation"
import type { CollectionItem } from "@/lib/types"

function Thumb({ item, className }: { item: CollectionItem; className: string }) {
  const src = item.watch.imageUrls?.[0]
  if (src) {
    // Plain img: watch photos are arbitrary user-pasted URLs.
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={src}
        alt={`${item.watch.brand} ${item.watch.model}`}
        className={`object-cover ${className}`}
      />
    )
  }
  return (
    <div className={`flex items-center justify-center bg-secondary ${className}`}>
      <div className="w-10 h-10 rounded-full border border-border/40 opacity-30" />
    </div>
  )
}

export function WatchCard({ item }: { item: CollectionItem }) {
  const t = useTranslations("Labels")
  return (
    <Link
      href={`/collection/${item.id}`}
      className="group block rounded-sm border border-border bg-card overflow-hidden hover:border-foreground/20 transition-colors"
    >
      <div className="relative aspect-square overflow-hidden">
        <Thumb item={item} className="w-full h-full transition-transform duration-500 group-hover:scale-[1.03]" />
        {item.status !== "owned" && (
          <span className="absolute top-2 right-2 label-caps bg-background/80 backdrop-blur-sm px-2 py-1 rounded-sm">
            {t(`watchStatus.${item.status}`)}
          </span>
        )}
      </div>
      <div className="p-3">
        <p className="label-caps mb-0.5">{item.watch.brand}</p>
        <p className="font-serif text-base text-foreground leading-tight">
          {item.watch.model}
        </p>
        <p className="text-xs text-primary/70 mt-1.5">
          {t(`primaryStyle.${item.primaryStyle}`)}
        </p>
      </div>
    </Link>
  )
}

export function WatchRow({ item }: { item: CollectionItem }) {
  const t = useTranslations("Labels")
  return (
    <Link
      href={`/collection/${item.id}`}
      className="group flex items-center gap-4 rounded-sm border border-border bg-card p-3 hover:border-foreground/20 transition-colors"
    >
      <Thumb item={item} className="w-14 h-14 rounded-sm shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="label-caps">{item.watch.brand}</p>
        <p className="font-serif text-base text-foreground truncate">
          {item.watch.model}
        </p>
      </div>
      <span className="text-xs text-primary/70 hidden sm:block">
        {t(`primaryStyle.${item.primaryStyle}`)}
      </span>
      {item.status !== "owned" && (
        <span className="label-caps">{t(`watchStatus.${item.status}`)}</span>
      )}
    </Link>
  )
}
