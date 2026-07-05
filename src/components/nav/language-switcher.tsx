"use client"

import { useTransition } from "react"
import { useLocale } from "next-intl"
import { GlobeIcon } from "lucide-react"
import { usePathname, useRouter } from "@/i18n/navigation"
import { routing } from "@/i18n/routing"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const LOCALE_LABELS: Record<string, string> = {
  en: "English",
  nl: "Nederlands",
}

/** Compact globe-icon dropdown in the nav — switches locale, keeps the current page. */
export function LanguageSwitcher() {
  const locale = useLocale()
  const pathname = usePathname()
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function switchTo(next: string) {
    if (next === locale) return
    startTransition(() => {
      router.replace(pathname, { locale: next })
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={pending}
        className="flex items-center gap-1.5 text-[11px] tracking-widest uppercase font-sans text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
        title={LOCALE_LABELS[locale] ?? locale}
      >
        <GlobeIcon className="size-4" />
        <span>{locale.toUpperCase()}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {routing.locales.map((l) => (
          <DropdownMenuItem
            key={l}
            onClick={() => switchTo(l)}
            className={l === locale ? "text-primary" : undefined}
          >
            {LOCALE_LABELS[l] ?? l}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
