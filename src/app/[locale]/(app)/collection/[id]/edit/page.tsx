import { notFound } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { Link } from "@/i18n/navigation"
import { requireUser } from "@/lib/auth/session"
import { getCollectionItem } from "@/lib/collection/queries"
import { updateWatch } from "@/lib/collection/actions"
import { isImageStorageConfigured } from "@/lib/storage/r2"
import { WatchForm } from "@/components/collection/watch-form"

export default async function EditWatchPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await requireUser()
  const item = await getCollectionItem(user.id, id)
  if (!item) notFound()
  const t = await getTranslations("CollectionEditPage")

  const action = updateWatch.bind(null, id)

  return (
    <div className="space-y-10">
      <div>
        <Link
          href={`/collection/${id}`}
          className="label-caps hover:text-foreground transition-colors"
        >
          ← {item.watch.brand} {item.watch.model}
        </Link>
        <h1 className="font-serif text-4xl font-medium mt-3">{t("title")}</h1>
      </div>

      <WatchForm
        action={action}
        defaultValues={item}
        submitLabel={t("saveChanges")}
        cancelHref={`/collection/${id}`}
        imageUploadEnabled={isImageStorageConfigured()}
      />
    </div>
  )
}
