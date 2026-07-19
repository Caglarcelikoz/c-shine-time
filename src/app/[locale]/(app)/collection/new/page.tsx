import { getTranslations } from "next-intl/server"
import { Link } from "@/i18n/navigation"
import { addWatch } from "@/lib/collection/actions"
import { isImageStorageConfigured } from "@/lib/storage/r2"
import { AddWatchFlow } from "@/components/collection/add-watch-flow"

/**
 * Photo import enriches specs via a catalog match then a ~15s web-search
 * fallback; give the Server Action headroom above that so the platform never
 * truncates before the app's own timeout fires.
 */
export const maxDuration = 30

export default async function NewWatchPage() {
  const imageUploadEnabled = isImageStorageConfigured()
  const t = await getTranslations("CollectionNewPage")

  return (
    <div className="space-y-10">
      <div>
        <Link
          href="/collection"
          className="label-caps hover:text-foreground transition-colors"
        >
          {t("backToCollection")}
        </Link>
        <h1 className="font-serif text-4xl font-medium mt-3">{t("title")}</h1>
        <p className="text-muted-foreground text-sm mt-2">
          {t("subtitle")}
        </p>
      </div>

      <AddWatchFlow
        action={addWatch}
        imageUploadEnabled={imageUploadEnabled}
        aiImportEnabled={imageUploadEnabled && Boolean(process.env.OPENAI_API_KEY)}
      />
    </div>
  )
}
