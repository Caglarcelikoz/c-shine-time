export const CURRENCIES = ["EUR", "USD", "GBP", "CHF", "JPY", "AUD", "CAD"] as const
export type Currency = (typeof CURRENCIES)[number]

export const DEFAULT_CURRENCY: Currency = "EUR"

/** Format an amount in its currency, e.g. 4275 + "EUR" → "€4,275". null when absent. */
export function formatMoney(
  amount: string | number | null | undefined,
  currency: string | null | undefined = DEFAULT_CURRENCY
): string | null {
  if (amount == null || amount === "") return null
  const n = typeof amount === "string" ? Number(amount) : amount
  if (!Number.isFinite(n)) return null
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || DEFAULT_CURRENCY,
      maximumFractionDigits: 0,
    }).format(n)
  } catch {
    return `${currency ?? ""} ${n.toLocaleString("en-US")}`.trim()
  }
}
