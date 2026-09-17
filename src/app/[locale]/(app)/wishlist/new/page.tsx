import { getTranslations } from "next-intl/server"
import { Link } from "@/i18n/navigation"
import { addWishlistItem } from "@/lib/collection/actions"
import { isImageStorageConfigured } from "@/lib/storage/r2"
import { AddWatchFlow } from "@/components/collection/add-watch-flow"

/**
 * Same headroom as the collection's add page: photo import enriches specs via a
 * catalog match then a ~15s web-search fallback, so the Server Action needs room
 * above that before the platform truncates it.
 */
export const maxDuration = 30

export default async function NewWishlistPage() {
  const imageUploadEnabled = isImageStorageConfigured()
  const t = await getTranslations("WishlistNewPage")

  return (
    <div className="space-y-10">
      <div>
        <Link
          href="/wishlist"
          className="label-caps hover:text-foreground transition-colors"
        >
          {t("backToWishlist")}
        </Link>
        <h1 className="font-serif text-4xl font-medium mt-3">{t("title")}</h1>
        <p className="text-muted-foreground text-sm mt-2">
          {t("subtitle")}
        </p>
      </div>

      <AddWatchFlow
        action={addWishlistItem}
        variant="wishlist"
        submitLabel={t("addToWishlist")}
        cancelHref="/wishlist"
        imageUploadEnabled={imageUploadEnabled}
        aiImportEnabled={imageUploadEnabled && Boolean(process.env.OPENAI_API_KEY)}
      />
    </div>
  )
}
