/** Numeric string/number → clean display ("39.0" → "39"). Empty for null. */
export function fmtNum(v: string | number | null | undefined): string {
  if (v == null || v === "") return ""
  const n = typeof v === "string" ? Number(v) : v
  if (!Number.isFinite(n)) return ""
  return String(n)
}

/** Price → "12,500" (no currency symbol). null when absent. */
export function fmtPrice(v: string | number | null | undefined): string | null {
  if (v == null || v === "") return null
  const n = typeof v === "string" ? Number(v) : v
  if (!Number.isFinite(n)) return null
  return n.toLocaleString("en-US")
}

/** Date → "yyyy-mm-dd" for <input type="date">. */
export function fmtDateInput(d: Date | string | null | undefined): string {
  if (!d) return ""
  const date = typeof d === "string" ? new Date(d) : d
  if (Number.isNaN(date.getTime())) return ""
  return date.toISOString().slice(0, 10)
}

/** Date → "May 2024" style for display. */
export function fmtDate(d: Date | string | null | undefined): string | null {
  if (!d) return null
  const date = typeof d === "string" ? new Date(d) : d
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" })
}
