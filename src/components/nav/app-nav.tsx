"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import type { Session } from "next-auth";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LanguageSwitcher } from "./language-switcher";

interface AppNavProps {
  session: Session;
}

export function AppNav({ session }: AppNavProps) {
  const t = useTranslations("Nav");
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const navLinks = [
    { href: "/dashboard", label: t("dashboard") },
    { href: "/collection", label: t("collection") },
    { href: "/wishlist", label: t("wishlist") },
    { href: "/advisor", label: t("aiAdvisor") },
    { href: "/compare", label: t("compare") },
    { href: "/profile", label: t("profile") },
    { href: "/settings", label: t("settings") },
  ];

  const isActive = (href: string) =>
    pathname === href || (href !== "/dashboard" && pathname.startsWith(href));

  const initials = session.user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="max-w-[1280px] mx-auto px-6 h-12 flex items-center justify-between">
        <Link
          href="/dashboard"
          className="font-serif text-lg italic tracking-wide text-foreground hover:text-primary transition-colors"
        >
          C-Shine Time
        </Link>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-7">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={[
                "text-[11px] tracking-widest uppercase font-sans transition-colors",
                isActive(href)
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              ].join(" ")}
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <LanguageSwitcher />

          {/* GO PRO — non-functional until Phase 4 */}
          <button
            disabled
            title={t("comingSoon")}
            className="hidden sm:inline-block text-[11px] tracking-widest uppercase font-sans text-primary border border-primary/40 px-3 py-1 rounded-sm opacity-60 cursor-not-allowed"
          >
            {t("goPro")}
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger
              className="w-7 h-7 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-xs font-sans text-primary hover:bg-primary/30 transition-colors"
              title={t("signedInAs", { name: session.user?.name ?? "" })}
            >
              {initials}
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <div className="px-2 py-1.5 text-xs text-muted-foreground truncate">
                {session.user?.email ?? session.user?.name}
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => signOut({ callbackUrl: "/login" })}
              >
                {t("signOut")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Hamburger — mobile only */}
          <button
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? t("closeMenu") : t("openMenu")}
            aria-expanded={open}
            className="lg:hidden w-8 h-8 flex flex-col items-center justify-center gap-1.5 text-foreground"
          >
            <span
              className={[
                "block w-5 h-px bg-current transition-transform",
                open ? "translate-y-[3.5px] rotate-45" : "",
              ].join(" ")}
            />
            <span
              className={[
                "block w-5 h-px bg-current transition-transform",
                open ? "-translate-y-[3.5px] -rotate-45" : "",
              ].join(" ")}
            />
          </button>
        </div>
      </div>

      {/* Mobile menu panel */}
      {open && (
        <nav className="lg:hidden border-t border-border bg-background/98 backdrop-blur-sm">
          <div className="max-w-[1280px] mx-auto px-6 py-3 flex flex-col">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={[
                  "py-3 text-xs tracking-widest uppercase font-sans border-b border-border/50 last:border-0 transition-colors",
                  isActive(href)
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                ].join(" ")}
              >
                {label}
              </Link>
            ))}
            <div className="flex items-center justify-between pt-4 pb-1">
              <button
                disabled
                title={t("comingSoon")}
                className="text-[11px] tracking-widest uppercase font-sans text-primary border border-primary/40 px-3 py-1 rounded-sm opacity-60 cursor-not-allowed"
              >
                {t("goPro")}
              </button>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="text-[11px] tracking-widest uppercase font-sans text-muted-foreground hover:text-foreground transition-colors"
              >
                {t("signOut")}
              </button>
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
