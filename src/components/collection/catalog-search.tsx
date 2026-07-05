"use client"

import { useRef, useState, useTransition } from "react"
import { useTranslations } from "next-intl"
import { SearchIcon } from "lucide-react"
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
} from "@/components/ui/combobox"
import { Label } from "@/components/ui/label"
import { searchCatalog, type CatalogSearchResult } from "@/lib/catalog/actions"

interface CatalogSearchProps {
  onSelect: (entryId: string) => void
}

const DEBOUNCE_MS = 200

/**
 * Catalog autocomplete — sits above the manual Identity fields. Selecting a
 * result pre-fills the same always-editable fields below (see
 * add-watch-flow.tsx's fromCatalogEntry); ignoring it and typing brand/model
 * directly works exactly as before. Search is server-side (external
 * filtering, filter={null}) since matching happens against the DB.
 */
export function CatalogSearch({ onSelect }: CatalogSearchProps) {
  const t = useTranslations("CatalogSearch")
  const [results, setResults] = useState<CatalogSearchResult[]>([])
  const [pending, startTransition] = useTransition()
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleInputValueChange(value: string) {
    if (timerRef.current) clearTimeout(timerRef.current)
    const query = value.trim()
    if (query.length < 2) {
      setResults([])
      return
    }
    timerRef.current = setTimeout(() => {
      startTransition(async () => {
        setResults(await searchCatalog(query))
      })
    }, DEBOUNCE_MS)
  }

  return (
    <div>
      <Label className="label-caps mb-1.5 block">{t("searchCatalog")}</Label>
      <Combobox
        items={results}
        filter={null}
        itemToStringLabel={(r: CatalogSearchResult) => r.label}
        onInputValueChange={handleInputValueChange}
        onValueChange={(entry: CatalogSearchResult | null) => {
          if (entry) onSelect(entry.id)
        }}
      >
        <ComboboxInput
          placeholder={t("placeholder")}
          className="bg-card border-border"
        >
          <SearchIcon className="pointer-events-none size-4 text-muted-foreground" />
        </ComboboxInput>
        <ComboboxContent>
          <ComboboxEmpty>
            {pending ? t("searching") : t("noMatches")}
          </ComboboxEmpty>
          <ComboboxList>
            {(entry: CatalogSearchResult) => (
              <ComboboxItem key={entry.id} value={entry}>
                <ComboboxValue>{entry.label}</ComboboxValue>
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
      <p className="text-xs text-muted-foreground mt-1">
        {t("hint")}
      </p>
    </div>
  )
}
