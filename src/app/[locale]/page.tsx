import { getServerSession } from "next-auth"
import Image from "next/image"
import { getTranslations } from "next-intl/server"
import { Link } from "@/i18n/navigation"
import { authOptions } from "@/lib/auth/config"
import { LandingNav } from "@/components/nav/landing-nav"

export default async function LandingPage() {
  const session = await getServerSession(authOptions)
  const isLoggedIn = !!session
  const t = await getTranslations("Landing")

  const pillars = [
    { number: "01", label: t("pillar1Label"), heading: t("pillar1Heading"), body: t("pillar1Body") },
    { number: "02", label: t("pillar2Label"), heading: t("pillar2Heading"), body: t("pillar2Body") },
    { number: "03", label: t("pillar3Label"), heading: t("pillar3Heading"), body: t("pillar3Body") },
  ]

  const freeFeatures = [
    t("freeFeature1"),
    t("freeFeature2"),
    t("freeFeature3"),
    t("freeFeature4"),
    t("freeFeature5"),
    t("freeFeature6"),
  ]

  const premiumFeatures = [
    t("premiumFeature1"),
    t("premiumFeature2"),
    t("premiumFeature3"),
    t("premiumFeature4"),
    t("premiumFeature5"),
    t("premiumFeature6"),
    t("premiumFeature7"),
    t("premiumFeature8"),
  ]

  return (
    <>
      <LandingNav isLoggedIn={isLoggedIn} />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      {/*
        Two-column layout inside the centered 1280px container.
        Left: text, vertically centered. Right: a contained portrait image
        card (rounded, bordered). The AI Insight card overlaps the image's
        bottom-left corner, hanging slightly below and to the left.
      */}
      <section className="px-6 pt-14">
        <div className="max-w-[1280px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center py-20 lg:py-24">
          {/* Left — text */}
          <div>
            <p className="label-gold-caps mb-7 tracking-[0.2em]">
              {t("heroEyebrow")}
            </p>

            <h1 className="font-serif font-medium leading-[1.04] mb-7">
              <span
                className="block"
                style={{ fontSize: "clamp(2.75rem, 5vw, 4.5rem)" }}
              >
                {t("heroTitleLine1")}
              </span>
              <span
                className="block italic text-primary"
                style={{ fontSize: "clamp(2.75rem, 5vw, 4.5rem)" }}
              >
                {t("heroTitleLine2")}
              </span>
            </h1>

            <p className="text-muted-foreground text-base leading-relaxed max-w-md mb-10">
              {t("heroSubtitle")}
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href={isLoggedIn ? "/dashboard" : "/register"}
                className="inline-flex items-center justify-center px-7 py-3.5 bg-primary text-primary-foreground text-[10px] tracking-[0.18em] uppercase font-sans rounded-sm hover:bg-primary/90 transition-colors"
              >
                {isLoggedIn ? t("yourCollection") : t("startYourWristfolio")}
              </Link>
              <Link
                href={isLoggedIn ? "/collection" : "/login"}
                className="inline-flex items-center justify-center px-7 py-3.5 border border-border text-[10px] tracking-[0.18em] uppercase font-sans rounded-sm text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors"
              >
                {isLoggedIn ? t("viewCollection") : t("exploreDemoCollection")}
              </Link>
            </div>
          </div>

          {/* Right — contained image card + overlapping AI Insight */}
          <div className="relative">
            <div className="relative aspect-[4/5] rounded-sm overflow-hidden border border-border">
              <Image
                src="/hero-watch-box.jpg"
                alt="Leather watch roll with Tudor Submariner, Grand Seiko Spring Drive, Cartier Tank, and Tudor Chronograph"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
                style={{ objectPosition: "50% 25%" }}
              />
            </div>

            {/* AI Insight — overlaps bottom-left corner, hangs below */}
            <div className="absolute left-0 bottom-0 translate-y-1/3 -translate-x-4 z-20 max-w-[300px]">
              <div className="rounded-sm border border-border bg-card/95 backdrop-blur-sm p-5">
                <p className="label-gold-caps mb-2.5 flex items-center gap-2">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary" />
                  {t("aiInsight")}
                </p>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {t.rich("aiInsightQuote", {
                    highlight: (chunks) => <span className="text-primary">{chunks}</span>,
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Three pillars ─────────────────────────────────────────────────── */}
      <section className="border-t border-border">
        <div className="max-w-[1280px] mx-auto grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border">
          {pillars.map(({ number, label, heading, body }) => (
            <div key={number} className="px-10 py-14 md:px-12">
              <p className="label-gold-caps mb-6">
                {number} — {label}
              </p>
              <h3 className="font-serif text-2xl font-medium mb-3 leading-snug">
                {heading}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Current rotation glimpse ───────────────────────────────────────── */}
      <section className="border-t border-border py-16 px-10 md:px-16 lg:px-24">
        <div className="max-w-[1280px] mx-auto">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="label-gold-caps mb-3">{t("aGlimpse")}</p>
              <h2 className="font-serif text-4xl md:text-5xl font-medium">
                {t("currentRotation")}
              </h2>
              <p className="text-muted-foreground text-sm mt-2">
                {t("rotationCount")}
              </p>
            </div>
            <Link
              href={isLoggedIn ? "/collection" : "/register"}
              className="hidden md:flex items-center gap-2 text-[10px] tracking-[0.18em] uppercase font-sans text-muted-foreground hover:text-foreground transition-colors"
            >
              {t("viewFullPortfolio")}
            </Link>
          </div>

          {/* Watch card grid — placeholder cards, filled by seed data in Epic B */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { brand: "Tudor", model: "Black Bay 54" },
              { brand: "Seiko", model: "Alpinist" },
              { brand: "Omega", model: "Aqua Terra 150m" },
              { brand: "Longines", model: "Spirit Zulu Time 39" },
            ].map(({ brand, model }) => (
              <div
                key={model}
                className="aspect-square rounded-sm border border-border bg-card relative overflow-hidden group"
              >
                {/* Image placeholder — replace with next/image */}
                <div
                  className="absolute inset-0"
                  style={{
                    background: `linear-gradient(135deg,
                      oklch(0.17 0.01 55) 0%,
                      oklch(0.22 0.025 50) 100%
                    )`,
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full border border-border/40 opacity-30" />
                </div>
                {/* Caption */}
                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-background/90 to-transparent">
                  <p className="text-xs text-muted-foreground font-sans uppercase tracking-widest">
                    {brand}
                  </p>
                  <p className="font-serif text-sm text-foreground">{model}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 md:hidden">
            <Link
              href={isLoggedIn ? "/collection" : "/register"}
              className="text-[10px] tracking-[0.18em] uppercase font-sans text-muted-foreground hover:text-foreground transition-colors"
            >
              {t("viewFullPortfolio")}
            </Link>
          </div>
        </div>
      </section>

      {/* ── Pricing ───────────────────────────────────────────────────────── */}
      <section className="border-t border-border py-24 px-10 md:px-16 lg:px-24">
        <div className="max-w-[1280px] mx-auto">
          <div className="mb-16">
            <p className="label-gold-caps mb-4">{t("pricing")}</p>
            <h2 className="font-serif text-4xl md:text-5xl font-medium mb-4">
              {t("startFree")}{" "}
              <span className="text-primary italic">{t("upgradeWhenReady")}</span>
            </h2>
            <p className="text-muted-foreground text-sm max-w-md leading-relaxed">
              {t("pricingSubtitle")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
            <div className="rounded-sm border border-border bg-card p-8">
              <p className="label-caps mb-3">{t("free")}</p>
              <div className="flex items-end gap-1 mb-1">
                <span className="font-serif text-5xl font-medium">€0</span>
              </div>
              <p className="text-xs text-muted-foreground mb-8">{t("foreverFree")}</p>
              <ul className="space-y-2.5">
                {freeFeatures.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm text-muted-foreground">
                    <span className="text-primary/60 mt-0.5 shrink-0">—</span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/register"
                className="mt-8 block text-center py-3 border border-border text-[10px] tracking-[0.18em] uppercase font-sans rounded-sm text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors"
              >
                {t("getStarted")}
              </Link>
            </div>

            <div className="rounded-sm border border-primary/30 bg-card p-8 relative overflow-hidden">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    "radial-gradient(ellipse 80% 50% at 50% 0%, oklch(0.72 0.06 75 / 5%) 0%, transparent 70%)",
                }}
              />
              <p className="label-gold-caps mb-3">{t("premium")}</p>
              <div className="flex items-end gap-1 mb-1">
                <span className="font-serif text-5xl font-medium">€9</span>
                <span className="text-muted-foreground text-sm font-sans mb-2">{t("perMonth")}</span>
              </div>
              <p className="text-xs text-muted-foreground mb-8">{t("billedMonthly")}</p>
              <ul className="space-y-2.5">
                {premiumFeatures.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm text-foreground">
                    <span className="text-primary mt-0.5 shrink-0">—</span>
                    {f}
                  </li>
                ))}
              </ul>
              <button
                disabled
                title={t("comingInPhase4")}
                className="mt-8 w-full py-3 bg-primary/20 border border-primary/30 text-primary/50 text-[10px] tracking-[0.18em] uppercase font-sans rounded-sm cursor-not-allowed"
              >
                {t("goProComingSoon")}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="border-t border-border py-10 px-10 md:px-16 lg:px-24">
        <div className="max-w-[1280px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="font-serif italic text-lg text-muted-foreground">Wristfolio</span>
          <p className="text-xs text-muted-foreground text-center">
            {t("footerNote")}
          </p>
          <div className="flex items-center gap-6">
            <Link href="/login" className="text-[10px] tracking-widest uppercase font-sans text-muted-foreground hover:text-foreground transition-colors">
              {t("signIn")}
            </Link>
            <Link href="/register" className="text-[10px] tracking-widest uppercase font-sans text-muted-foreground hover:text-foreground transition-colors">
              {t("register")}
            </Link>
          </div>
        </div>
      </footer>
    </>
  )
}
