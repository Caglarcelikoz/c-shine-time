import { eq } from "drizzle-orm";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

export default async function ProfilePage() {
  const sessionUser = await requireUser();
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, sessionUser.id))
    .limit(1);
  const t = await getTranslations("ProfilePage");

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <p className="label-gold-caps mb-2">{t("yourProfile")}</p>
        <h1 className="font-serif text-4xl font-medium">
          {t("publicProfile")}
        </h1>
        <p className="text-muted-foreground text-sm mt-2">{t("subtitle")}</p>
      </div>

      <div className="rounded-sm border border-border bg-card p-6">
        <p className="label-caps mb-2">{t("yourPublicLink")}</p>
        <p className="font-serif text-2xl mb-4">
          time.cshinedigital.com/{user.username}
        </p>

        <div className="flex items-center gap-3 mb-6">
          <span
            className={[
              "label-caps px-2 py-1 rounded-sm border",
              user.publicProfileEnabled
                ? "text-primary border-primary/40"
                : "text-muted-foreground border-border",
            ].join(" ")}
          >
            {user.publicProfileEnabled ? t("public") : t("private")}
          </span>
          <span className="text-xs text-muted-foreground">
            {user.publicProfileEnabled ? t("anyoneCanView") : t("turnOnHint")}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={`/${user.username}`}
            className="px-5 py-2.5 bg-primary text-primary-foreground text-[10px] tracking-[0.18em] uppercase font-sans rounded-sm hover:bg-primary/90 transition-colors"
          >
            {t("viewPublicProfile")}
          </Link>
          <Link
            href="/settings"
            className="text-[10px] tracking-[0.18em] uppercase font-sans text-muted-foreground hover:text-foreground transition-colors"
          >
            {t("privacySettings")}
          </Link>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        {t.rich("visibilityNote", {
          public: (chunks) => <span className="text-foreground">{chunks}</span>,
        })}
      </p>
    </div>
  );
}
