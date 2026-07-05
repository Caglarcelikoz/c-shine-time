"use client"

import { useState, useTransition } from "react"
import { useTranslations } from "next-intl"
import { updateProfileTheme } from "@/lib/settings/actions"
import {
  PROFILE_THEMES,
  THEME_SWATCH_BG,
  THEME_SWATCH_ACCENT,
  type ProfileTheme,
} from "@/lib/profile/themes"

export function ThemePicker({ initial }: { initial: ProfileTheme }) {
  const t = useTranslations("Settings")
  const [active, setActive] = useState<ProfileTheme>(initial)
  const [, startTransition] = useTransition()

  function pick(theme: ProfileTheme) {
    setActive(theme)
    startTransition(() => {
      updateProfileTheme(theme)
    })
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {PROFILE_THEMES.map((theme) => (
        <button
          key={theme}
          onClick={() => pick(theme)}
          className={[
            "rounded-sm border p-3 text-left transition-colors",
            active === theme
              ? "border-primary ring-1 ring-primary/40"
              : "border-border hover:border-primary/40",
          ].join(" ")}
        >
          {/* Swatch preview */}
          <div
            className="rounded-sm mb-2.5 h-10 w-full flex items-center px-2 gap-1.5"
            style={{ background: THEME_SWATCH_BG[theme] }}
          >
            <div
              className="h-2 w-2 rounded-full shrink-0"
              style={{ background: THEME_SWATCH_ACCENT[theme] }}
            />
            <div
              className="h-1 rounded-full flex-1 opacity-40"
              style={{ background: THEME_SWATCH_ACCENT[theme] }}
            />
          </div>
          <p className="text-[10px] font-sans tracking-widest uppercase text-foreground">
            {t(`theme.${theme}.label`)}
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">
            {t(`theme.${theme}.description`)}
          </p>
        </button>
      ))}
    </div>
  )
}
