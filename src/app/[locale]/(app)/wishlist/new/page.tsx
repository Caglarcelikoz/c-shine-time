import { getTranslations } from "next-intl/server"
import { Link } from "@/i18n/navigation"
import { addWishlistItem } from "@/lib/collection/actions"
import { isImageStorageConfigured } from "@/lib/storage/r2"
import { WatchForm } from "@/components/collection/watch-form"

export default async function NewWishlistPage() {
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

      <WatchForm
        action={addWishlistItem}
        variant="wishlist"
        submitLabel={t("addToWishlist")}
        cancelHref="/wishlist"
        imageUploadEnabled={isImageStorageConfigured()}
      />
    </div>
  )
}
