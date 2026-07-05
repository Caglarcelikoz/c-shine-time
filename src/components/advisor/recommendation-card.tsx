import { useTranslations } from "next-intl"
import { formatMoney } from "@/lib/currency"
import type { RecommendationCard as Rec } from "@/lib/ai/types"

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5">
      <span className="label-caps shrink-0">{label}</span>
      <span className="text-sm text-foreground text-right">{value}</span>
    </div>
  )
}

export function RecommendationCard({ rec }: { rec: Rec }) {
  const t = useTranslations("Advisor")
  const tLabels = useTranslations("Labels")
  return (
    <div className="rounded-sm border border-border bg-background p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="label-caps text-muted-foreground">{rec.brand}</p>
          <h4 className="font-serif text-2xl font-medium leading-tight">
            {rec.model}
          </h4>
          {rec.reference && (
            <p className="text-xs text-muted-foreground mt-0.5">{rec.reference}</p>
          )}
        </div>
        {rec.fitScore != null && (
          <div className="text-right shrink-0">
            <p className="label-gold-caps">{t("fit")}</p>
            <p className="font-serif text-3xl text-primary leading-none">
              {rec.fitScore}
            </p>
          </div>
        )}
      </div>

      <div className="border-t border-border pt-2 divide-y divide-border/50">
        <Row label={t("whyItFits")} value={rec.whyItFits} />
        <Row label={t("gapFilled")} value={rec.gapFilled} />
        <Row
          label={t("style")}
          value={`${tLabels(`primaryStyle.${rec.primaryStyle}`)} · ${rec.occasionTags
            .map((tag) => tLabels(`occasionTag.${tag}`))
            .join(", ")}`}
        />
        <Row label={t("possibleDownside")} value={rec.downside} />
        {rec.approxPrice > 0 && (
          <Row label={t("approxPrice")} value={`~${formatMoney(rec.approxPrice, "EUR")}`} />
        )}
      </div>
    </div>
  )
}
