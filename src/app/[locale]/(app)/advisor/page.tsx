import { getTranslations } from "next-intl/server"
import { requireUser } from "@/lib/auth/session"
import { buildAdvisorContext } from "@/lib/rule-engine"
import { Advisor } from "@/components/advisor/advisor"

export default async function AdvisorPage() {
  const user = await requireUser()
  const ctx = await buildAdvisorContext(user.id)
  const t = await getTranslations("AdvisorPage")
  const tLabels = await getTranslations("Labels")

  const insights: { label: string; body: string }[] = []
  if (ctx.computedAnalysis.missingStyles.length > 0) {
    const style = tLabels(`primaryStyle.${ctx.computedAnalysis.missingStyles[0]}`)
    insights.push({
      label: t("insightMissing", { style }),
      body: t("insightMissingBody", { style: style.toLowerCase() }),
    })
  }
  if (ctx.computedAnalysis.overrepresented.length > 0) {
    const o = ctx.computedAnalysis.overrepresented[0]
    const style = tLabels(`primaryStyle.${o.style}`)
    insights.push({
      label: t("insightOverlap", { style }),
      body: t("insightOverlapBody", { count: o.count, style: style.toLowerCase() }),
    })
  }
  if (ctx.computedAnalysis.occasionGaps.length > 0) {
    const tag = tLabels(`occasionTag.${ctx.computedAnalysis.occasionGaps[0]}`)
    insights.push({
      label: t("insightGap", { tag }),
      body: t("insightGapBody", { tag: tag.toLowerCase() }),
    })
  }

  return (
    <Advisor
      tagScores={ctx.tasteProfile.tagScores}
      ownedCount={ctx.ownedWatches.length}
      wishlistCount={ctx.wishlist.length}
      insights={insights}
    />
  )
}
