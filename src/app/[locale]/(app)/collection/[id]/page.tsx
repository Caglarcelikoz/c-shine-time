import { notFound } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { Link } from "@/i18n/navigation"
import { requireUser } from "@/lib/auth/session"
import { getCollectionItem } from "@/lib/collection/queries"
import { getDocuments } from "@/lib/documents/actions"
import { getWearSummary } from "@/lib/wear/actions"
import { isStorageConfigured } from "@/lib/storage/r2"
import { DeleteWatchButton } from "@/components/collection/delete-watch-button"
import { WatchGallery } from "@/components/collection/watch-gallery"
import { WatchAiCard } from "@/components/collection/watch-ai-card"
import { PublicToggle } from "@/components/collection/public-toggle"
import { WearServiceCard } from "@/components/collection/wear-service-card"
import { DocumentVault } from "@/components/collection/document-vault"
import { fmtDate, fmtNum } from "@/lib/format"
import { formatMoney } from "@/lib/currency"
import type { CollectionItem } from "@/lib/types"

function Spec({ label, value }: { label: string; value: string | null }) {
  if (!value) return null
  return (
    <div>
      <p className="label-caps mb-1">{label}</p>
      <p className="text-sm text-foreground">{value}</p>
    </div>
  )
}

export default async function WatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await requireUser()
  const item: CollectionItem | null = await getCollectionItem(user.id, id)
  if (!item) notFound()
  const t = await getTranslations("CollectionDetail")
  const tLabels = await getTranslations("Labels")

  const { watch: w } = item
  const isOwned = item.status === "owned"
  const docs = isOwned ? await getDocuments(id, user.id) : []
  const storageConfigured = isStorageConfigured()
  const wearSummary = isOwned ? await getWearSummary(id, user.id) : null

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <Link href="/collection" className="label-caps hover:text-foreground transition-colors">
          {t("backToCollection")}
        </Link>
        <div className="flex items-center gap-5">
          <Link
            href={`/collection/${item.id}/edit`}
            className="text-[10px] tracking-[0.18em] uppercase font-sans text-muted-foreground hover:text-foreground transition-colors"
          >
            {t("edit")}
          </Link>
          <DeleteWatchButton id={item.id} watchName={`${w.brand} ${w.model}`} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Photo gallery — imageUrls[0] is the primary (ADR 0003) */}
        <WatchGallery
          userWatchId={item.id}
          urls={w.imageUrls ?? []}
          alt={`${w.brand} ${w.model}`}
        />

        {/* Header + classification */}
        <div className="space-y-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <p className="label-gold-caps">{w.brand}</p>
              <span className="label-caps">· {tLabels(`watchStatus.${item.status}`)}</span>
            </div>
            <h1 className="font-serif text-5xl font-medium leading-none">{w.model}</h1>
            {(w.reference || w.year) && (
              <p className="text-muted-foreground text-sm mt-3">
                {[w.reference, w.year].filter(Boolean).join(" · ")}
              </p>
            )}
          </div>

          <div>
            <p className="label-caps mb-3">{t("classification")}</p>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1.5 rounded-sm border border-primary/40 text-primary text-sm">
                {tLabels(`primaryStyle.${item.primaryStyle}`)}
              </span>
              {item.secondaryStyle && (
                <span className="px-3 py-1.5 rounded-sm border border-border text-muted-foreground text-sm">
                  {tLabels(`primaryStyle.${item.secondaryStyle}`)}
                </span>
              )}
              {item.occasionTags.map((tag) => (
                <span key={tag} className="px-3 py-1.5 rounded-sm border border-border text-muted-foreground text-sm">
                  {tLabels(`occasionTag.${tag}`)}
                </span>
              ))}
            </div>
          </div>

          {item.story && (
            <div>
              <p className="label-caps mb-2">{t("story")}</p>
              <p className="font-serif text-lg italic leading-relaxed text-foreground">
                &ldquo;{item.story}&rdquo;
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Per-watch privacy toggle */}
      {isOwned && <PublicToggle id={item.id} initial={item.isPublic} />}

      {/* AI analysis card */}
      <WatchAiCard watchId={item.id} />

      {/* Service & wear (owned only) */}
      {isOwned && (
        <WearServiceCard
          id={item.id}
          wearSummary={wearSummary!}
          purchasePrice={item.purchasePrice}
          currency={item.currency}
          lastServiceDate={item.lastServiceDate}
          nextServiceDue={item.nextServiceDue}
          warrantyExpiresAt={item.warrantyExpiresAt}
        />
      )}

      {/* Document vault (owned only) */}
      {isOwned && (
        <DocumentVault
          userWatchId={item.id}
          documents={docs}
          storageConfigured={storageConfigured}
        />
      )}

      {/* Specs */}
      <div className="border-t border-border pt-8">
        <p className="label-gold-caps mb-5">{t("specifications")}</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <Spec label={t("caseSize")} value={w.caseSize ? `${fmtNum(w.caseSize)} mm` : null} />
          <Spec label={t("thickness")} value={w.thickness ? `${fmtNum(w.thickness)} mm` : null} />
          <Spec label={t("lugToLug")} value={w.lugToLug ? `${fmtNum(w.lugToLug)} mm` : null} />
          <Spec label={t("movement")} value={w.movementType} />
          <Spec label={t("dialColor")} value={w.dialColor} />
          <Spec label={t("material")} value={w.material} />
          <Spec label={t("waterResistance")} value={w.waterResistance ? `${w.waterResistance} m` : null} />
          <Spec label={t("caseSizeBand")} value={item.caseSizeBand ? tLabels(`caseSizeBand.${item.caseSizeBand}`) : null} />
          <Spec label={t("colorFamily")} value={item.colorFamily ? tLabels(`colorFamily.${item.colorFamily}`) : null} />
        </div>
      </div>

      {/* Private info — owner only */}
      <div className="border-t border-border pt-8">
        <p className="label-gold-caps mb-1">{t("privateInformation")}</p>
        <p className="text-xs text-muted-foreground mb-5">
          {t("privateInformationHint")}
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <Spec label={t("purchasePrice")} value={formatMoney(item.purchasePrice, item.currency)} />
          <Spec label={t("purchaseDate")} value={fmtDate(item.purchaseDate)} />
          <Spec label={t("marketValue")} value={formatMoney(item.marketValueEstimate, item.currency)} />
          <Spec label={t("serialNumber")} value={item.serialNumber} />
        </div>
        {item.notes && (
          <div className="mt-6">
            <p className="label-caps mb-1">{t("notes")}</p>
            <p className="text-sm text-muted-foreground">{item.notes}</p>
          </div>
        )}
      </div>
    </div>
  )
}
