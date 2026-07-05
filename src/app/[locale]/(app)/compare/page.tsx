import { getTranslations } from "next-intl/server"
import { requireUser } from "@/lib/auth/session"
import {
  buildAdvisorContext,
  computeFitScore,
  sameOverlapProfile,
  toRuleWatch,
} from "@/lib/rule-engine"
import { PRIMARY_STYLE_LABELS } from "@/lib/labels"
import { CompareTool, type CompareColumn } from "@/components/compare/compare-tool"

export default async function ComparePage() {
  const user = await requireUser()
  const ctx = await buildAdvisorContext(user.id)
  const t = await getTranslations("ComparePage")
  const tLabels = await getTranslations("Labels")

  const columns: CompareColumn[] = ctx.items.map((item) => {
    const ownedExclSelf = ctx.ownedWatches.filter((o) => o.id !== item.id)
    const rule = toRuleWatch(item)
    return {
      id: item.id,
      external: false,
      brand: item.watch.brand,
      model: item.watch.model,
      reference: item.watch.reference,
      imageUrl: item.watch.imageUrls?.[0] ?? null,
      link: null,
      statusLabel: item.status === "owned" ? null : tLabels(`watchStatus.${item.status}`),
      price:
        Number(item.marketValueEstimate ?? item.purchasePrice ?? item.targetPrice) ||
        null,
      currency: item.currency,
      caseSize: item.watch.caseSize ? Number(item.watch.caseSize) : null,
      lugToLug: item.watch.lugToLug ? Number(item.watch.lugToLug) : null,
      thickness: item.watch.thickness ? Number(item.watch.thickness) : null,
      movement: item.watch.movementType,
      waterResistance: item.watch.waterResistance,
      primaryStyle: item.primaryStyle,
      primaryStyleLabel: PRIMARY_STYLE_LABELS[item.primaryStyle],
      fitScore: computeFitScore(
        rule,
        ownedExclSelf,
        ctx.tasteProfile.budgetRange ?? undefined
      ),
      overlapWithOwned: ownedExclSelf.filter((o) => sameOverlapProfile(rule, o)).length,
    }
  })

  return (
    <div className="space-y-8">
      <div>
        <p className="label-gold-caps mb-2">{t("sideBySide")}</p>
        <h1 className="font-serif text-4xl font-medium">{t("title")}</h1>
        <p className="text-muted-foreground text-sm mt-2">
          {t("subtitle")}
        </p>
      </div>

      <CompareTool
        columns={columns}
        ownedWatches={ctx.ownedWatches}
        budget={ctx.tasteProfile.budgetRange ?? null}
      />
    </div>
  )
}
