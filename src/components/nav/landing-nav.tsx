"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { LanguageSwitcher } from "./language-switcher";

interface LandingNavProps {
  isLoggedIn: boolean;
}

export function LandingNav({ isLoggedIn }: LandingNavProps) {
  const t = useTranslations("Nav");
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/90 backdrop-blur-sm">
      <div className="max-w-[1280px] mx-auto px-6 h-14 flex items-center justify-between">
        <span className="font-serif text-xl italic tracking-wide text-foreground">
          C-Shine Time
        </span>

        <nav className="flex items-center gap-6">
          <LanguageSwitcher />
          {isLoggedIn ? (
            <Link
              href="/dashboard"
              className="text-[11px] tracking-widest uppercase font-sans text-primary border border-primary/40 px-4 py-1.5 rounded-sm hover:bg-primary/10 transition-colors"
            >
              {t("yourCollectionArrow")}
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="text-[11px] tracking-widest uppercase font-sans text-muted-foreground hover:text-foreground transition-colors"
              >
                {t("signIn")}
              </Link>
              <Link
                href="/register"
                className="text-[11px] tracking-widest uppercase font-sans text-primary border border-primary/40 px-4 py-1.5 rounded-sm hover:bg-primary/10 transition-colors"
              >
                {t("getStarted")}
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
