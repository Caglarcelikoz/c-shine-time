"use server"

import { or, ilike, eq, sql } from "drizzle-orm"
import { db } from "@/lib/db"
import { watchCatalog } from "@/lib/db/schema"
import { requireUser } from "@/lib/auth/session"

export interface CatalogSearchResult {
  id: string
  label: string
}

const RESULT_LIMIT = 15

/**
 * Catalog autocomplete — searches the shared watch_catalog reference table
 * by brand/model/reference. Selecting a result pre-fills the add/edit form
 * (fromCatalogEntry); it never writes to watch_catalog itself.
 */
export async function searchCatalog(query: string): Promise<CatalogSearchResult[]> {
  await requireUser()

  const q = query.trim()
  if (q.length < 2) return []

  const pattern = `%${q}%`
  const rows = await db
    .select({
      id: watchCatalog.id,
      brand: watchCatalog.brand,
      model: watchCatalog.model,
      reference: watchCatalog.reference,
      caseSize: watchCatalog.caseSize,
    })
    .from(watchCatalog)
    .where(
      or(
        ilike(watchCatalog.brand, pattern),
        ilike(watchCatalog.model, pattern),
        ilike(watchCatalog.reference, pattern),
        ilike(sql`${watchCatalog.brand} || ' ' || ${watchCatalog.model}`, pattern)
      )
    )
    .limit(RESULT_LIMIT)

  return rows.map((r) => ({
    id: r.id,
    label: [
      `${r.brand} ${r.model}`,
      [r.reference, r.caseSize ? `${r.caseSize}mm` : null].filter(Boolean).join(", "),
    ]
      .filter(Boolean)
      .join(" — "),
  }))
}

/** Full record for a selected catalog entry — used to pre-fill the form. */
export async function getCatalogEntry(id: string) {
  await requireUser()
  const [entry] = await db
    .select()
    .from(watchCatalog)
    .where(eq(watchCatalog.id, id))
    .limit(1)
  return entry ?? null
}
