import { getTranslations } from "next-intl/server"
import { Link } from "@/i18n/navigation"
import { requireUser } from "@/lib/auth/session"
import { getCollection } from "@/lib/collection/queries"
import {
  computeCoverage,
  computeTagScores,
  toRuleWatch,
} from "@/lib/rule-engine"
import { TasteProfileBars } from "@/components/taste-profile-bars"
import { WatchCard, WatchRow } from "@/components/collection/watch-card"
import { SetupChecklist } from "@/components/onboarding/setup-checklist"
import { getOnboardingState } from "@/lib/onboarding/queries"
import { formatMoney } from "@/lib/currency"
import { fmtDate } from "@/lib/format"

function daysUntil(d: Date | string | null): number | null {
  if (!d) return null
  const date = typeof d === "string" ? new Date(d) : d
  if (Number.isNaN(date.getTime())) return null
  return Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}

export default async function DashboardPage() {
  const user = await requireUser()
  const [items, onboarding] = await Promise.all([
    getCollection(user.id),
    getOnboardingState(user.id),
  ])
  const t = await getTranslations("Dashboard")
  const tLabels = await getTranslations("Labels")

  const owned = items.filter((i) => i.status === "owned")
  const wishlist = items.filter((i) => i.status === "wishlist" || i.status === "grail")

  const ownedRule = owned.map(toRuleWatch)
  const coverage = computeCoverage(ownedRule)
  const tagScores = computeTagScores(ownedRule)

  // Service & warranty reminders — due within 90 days or overdue.
  const reminders = owned
    .flatMap((i) => {
      const out: { id: string; name: string; kind: "service" | "warranty"; date: Date | string; days: number }[] = []
      const svc = daysUntil(i.nextServiceDue)
      if (svc != null && svc <= 90)
        out.push({ id: i.id, name: `${i.watch.brand} ${i.watch.model}`, kind: "service", date: i.nextServiceDue!, days: svc })
      const war = daysUntil(i.warrantyExpiresAt)
      if (war != null && war <= 90)
        out.push({ id: i.id, name: `${i.watch.brand} ${i.watch.model}`, kind: "warranty", date: i.warrantyExpiresAt!, days: war })
      return out
    })
    .sort((a, b) => a.days - b.days)

  // Collection value — summed per currency (most watches share one).
  const totalsByCurrency = new Map<string, number>()
  for (const i of owned) {
    const v =
      i.marketValueEstimate != null
        ? Number(i.marketValueEstimate)
        : i.purchasePrice != null
          ? Number(i.purchasePrice)
          : 0
    if (v > 0) {
      const cur = i.currency || "EUR"
      totalsByCurrency.set(cur, (totalsByCurrency.get(cur) ?? 0) + v)
    }
  }
  const currencyEntries = [...totalsByCurrency.entries()].sort((a, b) => b[1] - a[1])
  const valueLabel =
    currencyEntries.length === 0
      ? "—"
      : formatMoney(currencyEntries[0][1], currencyEntries[0][0]) +
        (currencyEntries.length > 1 ? " +" : "")

  // Distinct brands across owned pieces.
  const brandCount = new Set(owned.map((i) => i.watch.brand)).size

  // Average fit score across owned pieces that have one.
  const fitScores = owned.map((i) => i.fitScore).filter((s): s is number => s != null)
  const avgFit =
    fitScores.length > 0
      ? Math.round(fitScores.reduce((a, b) => a + b, 0) / fitScores.length)
      : null

  // getCollection returns newest-first, so these are already in the right order.
  const recentlyAdded = owned.slice(0, 4)
  const wishlistTop = wishlist.slice(0, 4)

  const firstName = user.name?.split(" ")[0]

  // ADR 0004 — derived checklist: visible while incomplete and undismissed.
  const checklistComplete = owned.length >= 3 && onboarding.hasAdvisorRun
  const showChecklist = !onboarding.dismissed && !checklistComplete

  return (
    <div className="space-y-10">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="label-gold-caps mb-2">{t("yourCollection")}</p>
          <h1 className="font-serif text-4xl font-medium">
            {t("welcomeBack", { firstName: firstName ?? "" })}
          </h1>
        </div>
        <Link
          href="/collection/new"
          className="shrink-0 inline-flex items-center px-5 py-2.5 bg-primary text-primary-foreground text-[10px] tracking-[0.18em] uppercase font-sans rounded-sm hover:bg-primary/90 transition-colors"
        >
          {t("addWatch")}
        </Link>
      </div>

      {showChecklist && (
        <SetupChecklist
          ownedCount={owned.length}
          hasAdvisorRun={onboarding.hasAdvisorRun}
          aiEnabled={Boolean(process.env.OPENAI_API_KEY)}
        />
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="rounded-sm border border-border bg-card p-6">
          <p className="label-caps mb-2">{tLabels("watchStatus.owned")}</p>
          <p className="font-serif text-4xl">{owned.length}</p>
        </div>
        <div className="rounded-sm border border-border bg-card p-6">
          <p className="label-caps mb-2">{tLabels("watchStatus.wishlist")}</p>
          <p className="font-serif text-4xl">{wishlist.length}</p>
        </div>
        <div className="rounded-sm border border-border bg-card p-6">
          <p className="label-caps mb-2">{t("brands")}</p>
          <p className="font-serif text-4xl">{brandCount}</p>
        </div>
        <div className="rounded-sm border border-border bg-card p-6">
          <p className="label-caps mb-2">{t("avgFit")}</p>
          <p className="font-serif text-4xl">{avgFit ?? "—"}</p>
        </div>
        <div className="rounded-sm border border-border bg-card p-6 col-span-2 md:col-span-1">
          <p className="label-caps mb-2">{t("collectionValue")}</p>
          <p className="font-serif text-4xl">{valueLabel}</p>
        </div>
      </div>

      {/* Service & warranty reminders */}
      {reminders.length > 0 && (
        <div className="rounded-sm border border-primary/30 bg-card p-6">
          <p className="label-gold-caps mb-4">{t("serviceAndWarranty")}</p>
          <div className="space-y-2">
            {reminders.map((r, i) => (
              <Link
                key={`${r.id}-${r.kind}-${i}`}
                href={`/collection/${r.id}`}
                className="flex items-center justify-between gap-4 rounded-sm border border-border bg-background px-4 py-3 hover:border-foreground/20 transition-colors"
              >
                <div>
                  <p className="text-sm text-foreground">{r.name}</p>
                  <p className="label-caps mt-0.5">
                    {r.kind === "warranty"
                      ? t("warrantyExpiresOn", { date: fmtDate(r.date) ?? "" })
                      : t("serviceDueOn", { date: fmtDate(r.date) ?? "" })}
                  </p>
                </div>
                <span
                  className={[
                    "label-caps",
                    r.days < 0 ? "text-destructive" : "text-primary",
                  ].join(" ")}
                >
                  {r.days < 0 ? t("overdueBy", { days: Math.abs(r.days) }) : t("inDays", { days: r.days })}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {owned.length === 0 ? (
        // The setup checklist already carries the empty-state CTA when shown.
        showChecklist ? null : (
        <div className="rounded-sm border border-border bg-card p-10 text-center">
          <p className="font-serif text-2xl mb-2">{t("emptyTitle")}</p>
          <p className="text-muted-foreground text-sm mb-6">
            {t("emptyBody")}
          </p>
          <Link
            href="/collection/new"
            className="inline-flex items-center px-6 py-3 bg-primary text-primary-foreground text-[10px] tracking-[0.18em] uppercase font-sans rounded-sm hover:bg-primary/90 transition-colors"
          >
            {t("addWatch")}
          </Link>
        </div>
        )
      ) : (
        <>
        {/* Recently added */}
        <div>
          <div className="flex items-baseline justify-between mb-4">
            <p className="label-gold-caps">{t("recentlyAdded")}</p>
            <Link
              href="/collection"
              className="text-[10px] tracking-[0.18em] uppercase font-sans text-primary hover:opacity-80 transition-opacity"
            >
              {t("viewCollection")}
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {recentlyAdded.map((item) => (
              <WatchCard key={item.id} item={item} />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Taste profile */}
          <div className="rounded-sm border border-border bg-card p-6">
            <p className="label-gold-caps mb-5">{t("yourTasteProfile")}</p>
            <TasteProfileBars scores={tagScores} />
          </div>

          {/* Coverage insights — rule-based, no AI */}
          <div className="rounded-sm border border-border bg-card p-6">
            <p className="label-gold-caps mb-5">{t("collectionInsights")}</p>
            <div className="space-y-4 text-sm">
              {coverage.missingStyles.length > 0 && (
                <div>
                  <p className="label-caps mb-1">{t("missingStyles")}</p>
                  <p className="text-muted-foreground">
                    {coverage.missingStyles.map((s) => tLabels(`primaryStyle.${s}`)).join(" · ")}
                  </p>
                </div>
              )}
              {coverage.occasionGaps.length > 0 && (
                <div>
                  <p className="label-caps mb-1">{t("occasionGaps")}</p>
                  <p className="text-muted-foreground">
                    {coverage.occasionGaps.map((tag) => tLabels(`occasionTag.${tag}`)).join(" · ")}
                  </p>
                </div>
              )}
              {coverage.overrepresented.length > 0 && (
                <div>
                  <p className="label-caps mb-1">{t("overrepresented")}</p>
                  <p className="text-muted-foreground">
                    {coverage.overrepresented
                      .map((o) => `${tLabels(`primaryStyle.${o.style}`)} (${o.count})`)
                      .join(" · ")}
                  </p>
                </div>
              )}
              {coverage.missingStyles.length === 0 &&
                coverage.occasionGaps.length === 0 &&
                coverage.overrepresented.length === 0 && (
                  <p className="text-muted-foreground">
                    {t("wellBalanced")}
                  </p>
                )}
            </div>
            <Link
              href="/advisor"
              className="inline-block mt-6 text-[10px] tracking-[0.18em] uppercase font-sans text-primary hover:opacity-80 transition-opacity"
            >
              {t("openAiAdvisor")}
            </Link>
          </div>
        </div>

        {/* Wishlist snapshot */}
        {wishlistTop.length > 0 && (
          <div className="rounded-sm border border-border bg-card p-6">
            <div className="flex items-baseline justify-between mb-4">
              <p className="label-gold-caps">{t("wishlistSnapshot")}</p>
              <Link
                href="/wishlist"
                className="text-[10px] tracking-[0.18em] uppercase font-sans text-primary hover:opacity-80 transition-opacity"
              >
                {t("viewWishlist")}
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {wishlistTop.map((item) => {
                const target =
                  item.targetPrice != null
                    ? formatMoney(Number(item.targetPrice), item.currency || "EUR")
                    : null
                return (
                  <div key={item.id} className="space-y-1.5">
                    <WatchRow item={item} />
                    {(target || item.timeHorizon) && (
                      <div className="flex items-center gap-3 px-3">
                        {target && (
                          <span className="label-caps">
                            {t("target")}: <span className="text-foreground">{target}</span>
                          </span>
                        )}
                        {item.timeHorizon && (
                          <span className="label-caps text-primary/70">
                            {tLabels(`timeHorizon.${item.timeHorizon}`)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
        </>
      )}
    </div>
  )
}
