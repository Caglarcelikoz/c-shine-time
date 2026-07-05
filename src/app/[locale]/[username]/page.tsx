import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getPublicProfile, type PublicWatch } from "@/lib/profile/queries";
import { fmtNum } from "@/lib/format";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; username: string }>;
}) {
  const { username } = await params;
  const profile = await getPublicProfile(username);
  if (!profile || !profile.isPublic) return { title: "C-Shine Time" };
  return {
    title: `${profile.name} — Wristfolio`,
    description:
      profile.bio ?? `${profile.name}'s watch collection on Wristfolio.`,
  };
}

function Thumb({ w, className }: { w: PublicWatch; className: string }) {
  if (w.imageUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={w.imageUrl}
        alt={`${w.brand} ${w.model}`}
        className={`object-cover ${className}`}
      />
    );
  }
  return (
    <div
      className={`flex items-center justify-center bg-secondary ${className}`}
    >
      <div className="w-10 h-10 rounded-full border border-border/40 opacity-30" />
    </div>
  );
}

function PublicHeader({ buildYourOwn }: { buildYourOwn: string }) {
  return (
    <header className="border-b border-border">
      <div className="max-w-[1280px] mx-auto px-6 h-14 flex items-center justify-between">
        <Link
          href="/"
          className="font-serif text-xl italic tracking-wide text-foreground"
        >
          Wristfolio
        </Link>
        <Link
          href="/register"
          className="text-[11px] tracking-widest uppercase font-sans text-primary border border-primary/40 px-4 py-1.5 rounded-sm hover:bg-primary/10 transition-colors"
        >
          {buildYourOwn}
        </Link>
      </div>
    </header>
  );
}

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ locale: string; username: string }>;
}) {
  const { username } = await params;
  const profile = await getPublicProfile(username);
  if (!profile) notFound();
  const t = await getTranslations("PublicProfile");
  const tLabels = await getTranslations("Labels");

  if (!profile.isPublic) {
    return (
      <>
        <PublicHeader buildYourOwn={t("buildYourOwn")} />
        <main
          data-theme={profile.profileTheme}
          className="max-w-[1280px] mx-auto px-6 py-32 text-center"
        >
          <p className="label-gold-caps mb-3">{t("private")}</p>
          <h1 className="font-serif text-3xl font-medium mb-2">
            {t("profileIsPrivate")}
          </h1>
          <p className="text-muted-foreground text-sm">
            {t("hasntMadePublic", { name: profile.name })}
          </p>
        </main>
      </>
    );
  }

  const { stats } = profile;

  return (
    <>
      <PublicHeader buildYourOwn={t("buildYourOwn")} />
      <main
        data-theme={profile.profileTheme}
        className="max-w-[1280px] mx-auto px-6 py-14 space-y-16"
      >
        {/* Identity */}
        <section className="flex flex-col sm:flex-row gap-8 items-start">
          <div className="w-28 h-28 rounded-full overflow-hidden bg-secondary border border-border shrink-0">
            {profile.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatar}
                alt={profile.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-serif text-3xl text-muted-foreground">
                {profile.name.slice(0, 1)}
              </div>
            )}
          </div>
          <div className="flex-1">
            <p className="label-gold-caps mb-2">
              wristfolio.com/{profile.username}
            </p>
            <h1 className="font-serif text-5xl font-medium leading-none">
              {profile.name}
            </h1>
            {profile.bio && (
              <p className="text-muted-foreground text-sm mt-3 max-w-xl">
                {profile.bio}
              </p>
            )}
            {profile.tagScores.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {profile.tagScores.slice(0, 5).map((score) => (
                  <span
                    key={score.key}
                    className="label-caps border border-border rounded-sm px-2.5 py-1"
                  >
                    {tLabels(
                      `${score.group === "style" ? "primaryStyle" : "occasionTag"}.${score.key}`,
                    )}
                  </span>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Stats */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border border border-border">
          {[
            { n: stats.owned, l: tLabels("watchStatus.owned") },
            { n: stats.wishlist, l: tLabels("watchStatus.wishlist") },
            { n: stats.sold, l: tLabels("watchStatus.sold") },
          ].map((s) => (
            <div key={s.l} className="bg-background p-6">
              <p className="font-serif text-4xl">
                {String(s.n).padStart(2, "0")}
              </p>
              <p className="label-caps mt-1">{s.l}</p>
            </div>
          ))}
          <div className="bg-background p-6">
            <p className="font-serif text-4xl">{profile.totalValue ?? "—"}</p>
            <p className="label-caps mt-1">{t("estValue")}</p>
          </div>
        </section>

        {/* Featured */}
        {profile.featured && (
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div>
              <p className="label-gold-caps mb-3">{t("featuredPiece")}</p>
              <h2 className="font-serif text-4xl font-medium">
                {profile.featured.model}
              </h2>
              <p className="text-muted-foreground text-sm mt-2">
                {profile.featured.brand}
                {profile.featured.reference
                  ? ` · ${profile.featured.reference}`
                  : ""}
              </p>
              {profile.featured.story && (
                <p className="font-serif text-lg italic mt-5 text-foreground">
                  &ldquo;{profile.featured.story}&rdquo;
                </p>
              )}
            </div>
            <div className="aspect-square rounded-sm overflow-hidden border border-border order-first lg:order-last">
              <Thumb w={profile.featured} className="w-full h-full" />
            </div>
          </section>
        )}

        {/* Collection */}
        <section>
          <div className="flex items-baseline justify-between mb-6">
            <h2 className="font-serif text-3xl">{t("theCollection")}</h2>
            <p className="label-caps">
              {t("showingPublic", { count: profile.watches.length })}
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {profile.watches.map((w) => (
              <div
                key={w.id}
                className="rounded-sm border border-border bg-card overflow-hidden"
              >
                <div className="aspect-square overflow-hidden">
                  <Thumb w={w} className="w-full h-full" />
                </div>
                <div className="p-3">
                  <p className="label-caps">{w.brand}</p>
                  <p className="font-serif text-base leading-tight">
                    {w.model}
                  </p>
                  <p className="text-xs text-primary/70 mt-1.5">
                    {tLabels(`primaryStyle.${w.primaryStyle}`)}
                  </p>
                  {w.caseSize && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {fmtNum(w.caseSize)}mm ·{" "}
                      {w.occasionTags
                        .map((tag) => tLabels(`occasionTag.${tag}`))
                        .join(", ")}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Wishlist (optional) */}
        {profile.wishlist.length > 0 && (
          <section>
            <h2 className="font-serif text-3xl mb-6">{t("onTheWishlist")}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {profile.wishlist.map((w) => (
                <div
                  key={w.id}
                  className="rounded-sm border border-border bg-card overflow-hidden"
                >
                  <div className="aspect-square overflow-hidden bg-secondary">
                    {w.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={w.imageUrl}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="w-10 h-10 rounded-full border border-border/40 opacity-30" />
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="label-caps">{w.brand}</p>
                    <p className="font-serif text-base leading-tight">
                      {w.model}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <footer className="border-t border-border pt-8 text-center">
          <p className="text-xs text-muted-foreground">
            {t("curatedOn")}{" "}
            <Link href="/" className="text-primary hover:opacity-80">
              Wristfolio
            </Link>
          </p>
        </footer>
      </main>
    </>
  );
}
