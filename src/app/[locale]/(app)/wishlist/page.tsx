import { getTranslations } from "next-intl/server"
import { Link } from "@/i18n/navigation"
import { requireUser } from "@/lib/auth/session"
import { buildAdvisorContext, computeFitScore, toRuleWatch } from "@/lib/rule-engine"
import { WishlistBoard, type WishlistEntry } from "@/components/wishlist/wishlist-board"
import { WishlistPrioritizer } from "@/components/wishlist/wishlist-prioritizer"

export default async function WishlistPage() {
  const user = await requireUser()
  const ctx = await buildAdvisorContext(user.id)
  const t = await getTranslations("WishlistPage")

  const wishlistItems = ctx.items.filter(
    (i) => i.status === "wishlist" || i.status === "grail"
  )

  const entries: WishlistEntry[] = wishlistItems.map((item) => ({
    item,
    fitScore: computeFitScore(
      toRuleWatch(item),
      ctx.ownedWatches,
      ctx.tasteProfile.budgetRange ?? undefined
    ),
  }))

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <p className="label-gold-caps mb-2">{t("wishlistBoard")}</p>
          <h1 className="font-serif text-4xl font-medium">{t("planNextChapter")}</h1>
          <p className="text-muted-foreground text-sm mt-2">
            {t("dragHint")}
          </p>
        </div>
        <Link
          href="/wishlist/new"
          className="inline-flex items-center px-5 py-2.5 bg-primary text-primary-foreground text-[10px] tracking-[0.18em] uppercase font-sans rounded-sm hover:bg-primary/90 transition-colors"
        >
          {t("addToWishlist")}
        </Link>
      </div>

      {entries.length > 0 && <WishlistPrioritizer />}

      {entries.length === 0 ? (
        <div className="rounded-sm border border-border bg-card p-12 text-center">
          <p className="font-serif text-2xl mb-2">{t("emptyTitle")}</p>
          <p className="text-muted-foreground text-sm mb-6">
            {t("emptyBody")}
          </p>
          <Link
            href="/wishlist/new"
            className="inline-flex items-center px-6 py-3 bg-primary text-primary-foreground text-[10px] tracking-[0.18em] uppercase font-sans rounded-sm hover:bg-primary/90 transition-colors"
          >
            {t("addToWishlist")}
          </Link>
        </div>
      ) : (
        <WishlistBoard entries={entries} />
      )}
    </div>
  )
}
