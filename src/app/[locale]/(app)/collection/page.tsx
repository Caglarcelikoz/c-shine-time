import { getTranslations } from "next-intl/server"
import { Link } from "@/i18n/navigation"
import { requireUser } from "@/lib/auth/session"
import { getCollection } from "@/lib/collection/queries"
import { CollectionView } from "@/components/collection/collection-view"

export default async function CollectionPage() {
  const user = await requireUser()
  const items = await getCollection(user.id)
  const t = await getTranslations("CollectionPage")

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <p className="label-gold-caps mb-2">{t("theCollection")}</p>
          <h1 className="font-serif text-4xl font-medium">{t("yourPieces")}</h1>
        </div>
        <Link
          href="/collection/new"
          className="inline-flex items-center px-5 py-2.5 bg-primary text-primary-foreground text-[10px] tracking-[0.18em] uppercase font-sans rounded-sm hover:bg-primary/90 transition-colors"
        >
          {t("addWatch")}
        </Link>
      </div>

      <CollectionView items={items} />
    </div>
  )
}
