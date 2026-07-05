import { Download } from "lucide-react"
import { eq } from "drizzle-orm"
import { getTranslations } from "next-intl/server"
import { Link } from "@/i18n/navigation"
import { requireUser } from "@/lib/auth/session"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { UsernameForm } from "@/components/settings/username-form"
import { LockedRow, PrivacyToggle } from "@/components/settings/privacy-toggle"
import { ThemePicker } from "@/components/settings/theme-picker"
import type { ProfileTheme } from "@/lib/profile/themes"
import { PROFILE_THEMES } from "@/lib/profile/themes"

export default async function SettingsPage() {
  const sessionUser = await requireUser()
  const [user] = await db.select().from(users).where(eq(users.id, sessionUser.id)).limit(1)
  const t = await getTranslations("Settings")

  return (
    <div className="max-w-2xl space-y-10">
      <div>
        <p className="label-gold-caps mb-2">{t("account")}</p>
        <h1 className="font-serif text-4xl font-medium">{t("privacyAndSettings")}</h1>
        <p className="text-muted-foreground text-sm mt-2">
          {t("subtitle")}
        </p>
      </div>

      <UsernameForm initial={user.username} />

      <div>
        <h2 className="font-serif text-2xl mb-1">{t("profileVisibility")}</h2>
        <div className="rounded-sm border border-border bg-card px-6 mt-4">
          <PrivacyToggle
            keyName="publicProfileEnabled"
            label={t("makeProfilePublic")}
            description={t("makeProfilePublicDesc")}
            initial={user.publicProfileEnabled}
          />
          <PrivacyToggle
            keyName="hideCollectionValue"
            label={t("hideCollectionValue")}
            description={t("hideCollectionValueDesc")}
            initial={user.hideCollectionValue}
          />
          <PrivacyToggle
            keyName="hidePurchasePrices"
            label={t("hidePurchasePrices")}
            description={t("hidePurchasePricesDesc")}
            initial={user.hidePurchasePrices}
          />
          <PrivacyToggle
            keyName="hideWishlist"
            label={t("hideWishlist")}
            description={t("hideWishlistDesc")}
            initial={user.hideWishlist}
          />
          <PrivacyToggle
            keyName="hideSoldArchive"
            label={t("hideSoldArchive")}
            description={t("hideSoldArchiveDesc")}
            initial={user.hideSoldArchive}
          />
        </div>
      </div>

      <div>
        <h2 className="font-serif text-2xl mb-1">{t("perWatchControls")}</h2>
        <p className="text-sm text-muted-foreground mt-2">
          {t.rich("perWatchControlsDesc", {
            link: (chunks) => (
              <Link href="/collection" className="text-primary hover:opacity-80">
                {chunks}
              </Link>
            ),
          })}
        </p>
      </div>

      <div>
        <h2 className="font-serif text-2xl mb-1">{t("publicProfileTheme")}</h2>
        <p className="text-sm text-muted-foreground mt-2 mb-4">
          {t("publicProfileThemeDesc")}
        </p>
        <ThemePicker
          initial={
            PROFILE_THEMES.includes(user.profileTheme as ProfileTheme)
              ? (user.profileTheme as ProfileTheme)
              : "classic"
          }
        />
      </div>

      <div>
        <h2 className="font-serif text-2xl mb-1">{t("export")}</h2>
        <p className="text-sm text-muted-foreground mt-2 mb-4">
          {t("exportDesc")}
        </p>
        <a
          href="/api/insurance-pdf"
          download
          className="inline-flex items-center gap-2 px-5 py-2.5 border border-primary/40 text-primary text-[10px] tracking-[0.18em] uppercase font-sans rounded-sm hover:bg-primary/10 transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          {t("downloadInsurancePdf")}
        </a>
      </div>

      <div>
        <h2 className="font-serif text-2xl mb-1">{t("alwaysPrivate")}</h2>
        <div className="rounded-sm border border-border bg-card px-6 mt-4">
          <LockedRow
            label={t("serialNumbers")}
            description={t("serialNumbersDesc")}
          />
          <LockedRow
            label={t("documentsAndReceipts")}
            description={t("documentsAndReceiptsDesc")}
          />
        </div>
      </div>

      {/* Premium teaser — non-functional until Phase 4 */}
      <div className="rounded-sm border border-primary/30 bg-card p-6">
        <p className="label-gold-caps mb-2">{t("premium")}</p>
        <h3 className="font-serif text-xl mb-2">{t("unlockVault")}</h3>
        <p className="text-sm text-muted-foreground">
          {t("unlockVaultDesc")}
        </p>
        <button
          disabled
          className="mt-4 px-6 py-2.5 bg-primary/20 border border-primary/30 text-primary/50 text-[10px] tracking-[0.18em] uppercase font-sans rounded-sm cursor-not-allowed"
        >
          {t("goProComingSoon")}
        </button>
      </div>
    </div>
  )
}
