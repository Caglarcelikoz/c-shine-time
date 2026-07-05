import { useTranslations } from "next-intl"
import type { TagScore } from "@/lib/rule-engine"

/** C3 — horizontal taste-profile bars (image 10 style). */
export function TasteProfileBars({
  scores,
  limit,
}: {
  scores: TagScore[]
  limit?: number
}) {
  const t = useTranslations("Labels")
  const shown = limit ? scores.slice(0, limit) : scores

  if (shown.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        {t("emptyTasteProfile")}
      </p>
    )
  }

  return (
    <div className="space-y-2.5">
      {shown.map(({ key, group, score }) => (
        <div key={key} className="flex items-center gap-3">
          <span className="text-xs font-sans text-muted-foreground w-28 shrink-0">
            {t(`${group === "style" ? "primaryStyle" : "occasionTag"}.${key}`)}
          </span>
          <div className="flex-1 h-px bg-border relative">
            <div
              className="absolute top-1/2 -translate-y-1/2 h-[3px] bg-primary/60 rounded-full"
              style={{ width: `${score}%` }}
            />
          </div>
          <span className="text-xs font-sans text-muted-foreground w-6 text-right">
            {score}
          </span>
        </div>
      ))}
    </div>
  )
}
