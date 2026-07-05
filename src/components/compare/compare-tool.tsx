"use client"

import { useMemo, useState, useTransition } from "react"
import { useTranslations } from "next-intl"
import { compareWatches, importWatchFromUrl } from "@/lib/ai/actions"
import { computeFitScore } from "@/lib/rule-engine/fit-score"
import { sameOverlapProfile } from "@/lib/rule-engine/shared"
import type { RuleWatch } from "@/lib/rule-engine/types"
import { deriveCaseSizeBand, deriveColorFamily } from "@/lib/collection/derive"
import { PRIMARY_STYLE_LABELS } from "@/lib/labels"
import { OCCASION_TAGS, PRIMARY_STYLES } from "@/lib/types"
import type { OccasionTag, PrimaryStyle } from "@/lib/types"
import { formatMoney } from "@/lib/currency"
import { fmtNum } from "@/lib/format"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export interface CompareColumn {
  id: string
  external: boolean
  brand: string
  model: string
  reference: string | null
  imageUrl: string | null
  link: string | null
  statusLabel: string | null
  price: number | null
  currency: string
  caseSize: number | null
  lugToLug: number | null
  thickness: number | null
  movement: string | null
  waterResistance: number | null
  primaryStyle: PrimaryStyle
  /** English label, used only for the AI conclusion payload — display uses tLabels(primaryStyle). */
  primaryStyleLabel: string
  fitScore: number
  overlapWithOwned: number
}

const MAX = 4

type Budget = { min?: number | null; max?: number | null } | null

export function CompareTool({
  columns,
  ownedWatches,
  budget,
}: {
  columns: CompareColumn[]
  ownedWatches: RuleWatch[]
  budget: Budget
}) {
  const t = useTranslations("Compare")
  const tLabels = useTranslations("Labels")
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [externals, setExternals] = useState<CompareColumn[]>([])
  const [showForm, setShowForm] = useState(false)
  const [conclusion, setConclusion] = useState<{ message: string; recommendedId: string | null } | null>(null)
  const [pending, startTransition] = useTransition()

  const ROWS: { label: string; value: (c: CompareColumn) => string }[] = [
    { label: t("row.price"), value: (c) => formatMoney(c.price, c.currency) ?? "—" },
    { label: t("row.caseSize"), value: (c) => (c.caseSize ? `${fmtNum(c.caseSize)} mm` : "—") },
    { label: t("row.lugToLug"), value: (c) => (c.lugToLug ? `${fmtNum(c.lugToLug)} mm` : "—") },
    { label: t("row.thickness"), value: (c) => (c.thickness ? `${fmtNum(c.thickness)} mm` : "—") },
    { label: t("row.movement"), value: (c) => c.movement ?? "—" },
    { label: t("row.waterResistance"), value: (c) => (c.waterResistance ? `${c.waterResistance} m` : "—") },
    { label: t("row.style"), value: (c) => tLabels(`primaryStyle.${c.primaryStyle}`) },
    { label: t("row.collectionFit"), value: (c) => `${c.fitScore} / 100` },
    {
      label: t("row.overlapWithOwned"),
      value: (c) => t("overlapCount", { count: c.overlapWithOwned }),
    },
  ]

  const byId = useMemo(() => new Map(columns.map((c) => [c.id, c])), [columns])

  const selected: CompareColumn[] = [
    ...selectedIds.map((id) => byId.get(id)).filter((c): c is CompareColumn => Boolean(c)),
    ...externals,
  ]
  const total = selected.length

  function toggle(id: string) {
    setConclusion(null)
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : total >= MAX
          ? prev
          : [...prev, id]
    )
  }

  function addExternal(col: CompareColumn) {
    setConclusion(null)
    setExternals((prev) => [...prev, col])
    setShowForm(false)
  }

  function removeExternal(id: string) {
    setConclusion(null)
    setExternals((prev) => prev.filter((e) => e.id !== id))
  }

  function getConclusion() {
    startTransition(async () => {
      const res = await compareWatches(
        selectedIds,
        externals.map((e) => ({
          id: e.id,
          brand: e.brand,
          model: e.model,
          caseSize: e.caseSize,
          movement: e.movement,
          primaryStyle: e.primaryStyleLabel,
          price: e.price,
          overlapWithOwned: e.overlapWithOwned,
        }))
      )
      setConclusion({ message: res.message, recommendedId: res.recommendedId })
    })
  }

  if (columns.length === 0 && externals.length === 0) {
    return (
      <div className="space-y-4">
        <div className="rounded-sm border border-border bg-card p-10 text-center text-muted-foreground text-sm">
          {t("addWatchesFirst")}
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="text-[10px] tracking-[0.18em] uppercase font-sans text-primary hover:opacity-80"
        >
          {t("compareExternal")}
        </button>
        {showForm && (
          <ExternalForm ownedWatches={ownedWatches} budget={budget} onAdd={addExternal} onCancel={() => setShowForm(false)} />
        )}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Selection */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="label-caps">{t("selectWatches", { total, max: MAX })}</p>
          <button
            onClick={() => setShowForm((s) => !s)}
            disabled={total >= MAX}
            className="text-[10px] tracking-[0.18em] uppercase font-sans text-primary hover:opacity-80 disabled:opacity-40"
          >
            {t("externalWatch")}
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {columns.map((c) => {
            const active = selectedIds.includes(c.id)
            const disabled = !active && total >= MAX
            return (
              <button
                key={c.id}
                onClick={() => toggle(c.id)}
                disabled={disabled}
                className={[
                  "px-3 py-2 rounded-sm border text-sm transition-colors",
                  active
                    ? "border-primary text-primary bg-primary/5"
                    : disabled
                      ? "border-border text-muted-foreground/40 cursor-not-allowed"
                      : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30",
                ].join(" ")}
              >
                {c.brand} {c.model}
                {c.statusLabel && <span className="label-caps ml-2">{c.statusLabel}</span>}
              </button>
            )
          })}
          {externals.map((e) => (
            <span
              key={e.id}
              className="px-3 py-2 rounded-sm border border-primary/60 text-primary bg-primary/5 text-sm flex items-center gap-2"
            >
              {e.brand} {e.model}
              <span className="label-caps">{t("external")}</span>
              <button onClick={() => removeExternal(e.id)} className="text-muted-foreground hover:text-destructive" aria-label={t("remove")}>
                ×
              </button>
            </span>
          ))}
        </div>
      </div>

      {showForm && (
        <ExternalForm ownedWatches={ownedWatches} budget={budget} onAdd={addExternal} onCancel={() => setShowForm(false)} />
      )}

      {total < 2 ? (
        <div className="rounded-sm border border-border bg-card p-10 text-center text-muted-foreground text-sm">
          {t("selectAtLeastTwo")}
        </div>
      ) : (
        <>
          {/* Desktop: aligned table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="w-36" />
                  {selected.map((c) => (
                    <th
                      key={c.id}
                      className={[
                        "p-4 text-left align-bottom border-l border-border",
                        conclusion?.recommendedId === c.id ? "bg-primary/5" : "",
                      ].join(" ")}
                    >
                      <ColumnHead c={c} recommended={conclusion?.recommendedId === c.id} />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ROWS.map((row) => (
                  <tr key={row.label} className="border-t border-border">
                    <td className="py-3 pr-4 align-top"><span className="label-caps">{row.label}</span></td>
                    {selected.map((c) => (
                      <td
                        key={c.id}
                        className={[
                          "py-3 px-4 text-sm text-foreground border-l border-border align-top",
                          conclusion?.recommendedId === c.id ? "bg-primary/5" : "",
                        ].join(" ")}
                      >
                        {row.value(c)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile: stacked per-watch cards */}
          <div className="md:hidden space-y-4">
            {selected.map((c) => (
              <div
                key={c.id}
                className={[
                  "rounded-sm border bg-card overflow-hidden",
                  conclusion?.recommendedId === c.id ? "border-primary/60" : "border-border",
                ].join(" ")}
              >
                <div className="flex gap-3 p-3 border-b border-border">
                  <div className="w-20 h-20 rounded-sm overflow-hidden bg-secondary shrink-0">
                    {c.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.imageUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="w-8 h-8 rounded-full border border-border/40 opacity-30" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="label-caps">{c.brand}</p>
                    <p className="font-serif text-lg leading-tight">{c.model}</p>
                    {conclusion?.recommendedId === c.id && <p className="label-gold-caps mt-1">{t("bestFit")}</p>}
                    {c.external && c.link && <ListingLink href={c.link} />}
                  </div>
                </div>
                <dl className="divide-y divide-border/50">
                  {ROWS.map((row) => (
                    <div key={row.label} className="flex items-center justify-between px-3 py-2.5">
                      <dt className="label-caps">{row.label}</dt>
                      <dd className="text-sm text-foreground text-right">{row.value(c)}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
          </div>

          {/* AI conclusion */}
          <div className="rounded-sm border border-border bg-card p-6">
            <div className="flex items-center justify-between mb-3">
              <p className="label-gold-caps flex items-center gap-2">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary" />
                {t("aiConclusion")}
              </p>
              <button
                onClick={getConclusion}
                disabled={pending}
                className="px-5 py-2.5 border border-primary/40 text-primary text-[10px] tracking-[0.18em] uppercase font-sans rounded-sm hover:bg-primary/10 transition-colors disabled:opacity-50"
              >
                {pending ? t("thinking") : conclusion ? t("refresh") : t("getConclusion")}
              </button>
            </div>
            {conclusion ? (
              <p className="font-sans text-sm leading-relaxed text-foreground">{conclusion.message}</p>
            ) : (
              <p className="text-sm text-muted-foreground">
                {t("conclusionHint")}
              </p>
            )}
          </div>
        </>
      )}
    </div>
  )
}

function ListingLink({ href }: { href: string }) {
  const t = useTranslations("Compare")
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer nofollow"
      className="inline-block mt-1 text-[10px] tracking-[0.18em] uppercase font-sans text-primary hover:opacity-80"
    >
      {t("viewListing")}
    </a>
  )
}

function ColumnHead({ c, recommended }: { c: CompareColumn; recommended: boolean }) {
  const t = useTranslations("Compare")
  return (
    <>
      <div className="aspect-square rounded-sm overflow-hidden bg-secondary mb-3 max-w-[160px]">
        {c.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={c.imageUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-10 h-10 rounded-full border border-border/40 opacity-30" />
          </div>
        )}
      </div>
      <p className="label-caps">{c.brand}{c.external ? ` · ${t("external")}` : ""}</p>
      <p className="font-serif text-lg font-medium leading-tight">{c.model}</p>
      {c.reference && <p className="text-xs text-muted-foreground mt-0.5">{c.reference}</p>}
      {c.external && c.link && <ListingLink href={c.link} />}
      {recommended && <p className="label-gold-caps mt-2">{t("bestFit")}</p>}
    </>
  )
}

type ExternalFields = {
  brand: string
  model: string
  caseSize: string
  dialColor: string
  lugToLug: string
  thickness: string
  movement: string
  waterResistance: string
  price: string
  link: string
  image: string
}

const EMPTY_FIELDS: ExternalFields = {
  brand: "", model: "", caseSize: "", dialColor: "", lugToLug: "",
  thickness: "", movement: "", waterResistance: "", price: "", link: "", image: "",
}

function ExternalForm({
  ownedWatches,
  budget,
  onAdd,
  onCancel,
}: {
  ownedWatches: RuleWatch[]
  budget: Budget
  onAdd: (c: CompareColumn) => void
  onCancel: () => void
}) {
  const t = useTranslations("Compare")
  const tLabels = useTranslations("Labels")
  const [fields, setFields] = useState<ExternalFields>(EMPTY_FIELDS)
  const [style, setStyle] = useState<PrimaryStyle>("dress")
  const [tags, setTags] = useState<OccasionTag[]>([])
  const [url, setUrl] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [importing, startImport] = useTransition()

  function set<K extends keyof ExternalFields>(key: K, value: string) {
    setFields((f) => ({ ...f, [key]: value }))
  }

  function fetchFromUrl() {
    setError(null)
    setNotice(null)
    startImport(async () => {
      const res = await importWatchFromUrl(url)
      if (!res.ok || !res.watch) {
        setError(res.error ?? t("couldntImport"))
        return
      }
      const w = res.watch
      setFields({
        brand: w.brand ?? "",
        model: w.model ?? "",
        caseSize: w.caseSize?.toString() ?? "",
        dialColor: w.dialColor ?? "",
        lugToLug: w.lugToLug?.toString() ?? "",
        thickness: w.thickness?.toString() ?? "",
        movement: w.movement ?? "",
        waterResistance: w.waterResistance?.toString() ?? "",
        price: w.price?.toString() ?? "",
        link: url,
        image: w.image ?? "",
      })
      setStyle(w.primaryStyle)
      setTags(w.occasionTags)
      setNotice(t("importedNotice"))
    })
  }

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!fields.brand.trim() || !fields.model.trim()) return setError(t("brandModelRequired"))
    if (tags.length === 0) return setError(t("pickOccasionTag"))

    const num = (s: string) => {
      const n = s.trim() === "" ? null : Number(s)
      return n != null && Number.isFinite(n) ? n : null
    }
    const caseSize = num(fields.caseSize)
    const dialColor = fields.dialColor.trim() || null
    const price = num(fields.price)

    const caseSizeBand = deriveCaseSizeBand(caseSize)
    const colorFamily = deriveColorFamily(dialColor)
    const candidate = { primaryStyle: style, occasionTags: tags, caseSizeBand, colorFamily, price }
    const fitScore = computeFitScore(candidate, ownedWatches, budget ?? undefined)
    const overlapWithOwned = ownedWatches.filter((o) =>
      sameOverlapProfile({ primaryStyle: style, colorFamily, caseSizeBand }, o)
    ).length

    onAdd({
      id: `ext-${Date.now()}`,
      external: true,
      brand: fields.brand.trim(),
      model: fields.model.trim(),
      reference: null,
      imageUrl: fields.image.trim() || null,
      link: fields.link.trim() || null,
      statusLabel: t("external"),
      price,
      currency: "EUR",
      caseSize,
      lugToLug: num(fields.lugToLug),
      thickness: num(fields.thickness),
      movement: fields.movement.trim() || null,
      waterResistance: num(fields.waterResistance),
      primaryStyle: style,
      primaryStyleLabel: PRIMARY_STYLE_LABELS[style],
      fitScore,
      overlapWithOwned,
    })
  }

  const inputCls = "bg-background border-border"
  const fieldLabel = "label-caps mb-1.5 block"

  return (
    <form onSubmit={submit} className="rounded-sm border border-primary/30 bg-card p-5 space-y-5">
      <p className="label-gold-caps">{t("compareExternal")}</p>

      {/* URL import */}
      <div>
        <Label htmlFor="ext-url" className={fieldLabel}>{t("pasteListingUrl")}</Label>
        <div className="flex gap-2">
          <Input
            id="ext-url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            type="url"
            placeholder="https://www.bol.com/…"
            className={inputCls}
          />
          <button
            type="button"
            onClick={fetchFromUrl}
            disabled={importing || !url.trim()}
            className="shrink-0 px-5 bg-primary text-primary-foreground text-[10px] tracking-[0.18em] uppercase font-sans rounded-sm hover:bg-primary/90 disabled:opacity-50"
          >
            {importing ? t("reading") : t("fetchWithAi")}
          </button>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {t("fillManuallyHint")}
        </p>
        {notice && <p className="text-xs text-primary mt-2">{notice}</p>}
      </div>

      <div className="border-t border-border pt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="ext-brand" className={fieldLabel}>{t("brand")} *</Label>
          <Input id="ext-brand" value={fields.brand} onChange={(e) => set("brand", e.target.value)} placeholder="Citizen" className={inputCls} />
        </div>
        <div>
          <Label htmlFor="ext-model" className={fieldLabel}>{t("model")} *</Label>
          <Input id="ext-model" value={fields.model} onChange={(e) => set("model", e.target.value)} placeholder="Tsuyosa" className={inputCls} />
        </div>
        <div>
          <Label htmlFor="ext-caseSize" className={fieldLabel}>{t("caseSize")}</Label>
          <Input id="ext-caseSize" value={fields.caseSize} onChange={(e) => set("caseSize", e.target.value)} type="number" step="0.1" placeholder="40" className={inputCls} />
        </div>
        <div>
          <Label htmlFor="ext-dialColor" className={fieldLabel}>{t("dialColor")}</Label>
          <Input id="ext-dialColor" value={fields.dialColor} onChange={(e) => set("dialColor", e.target.value)} placeholder="Silver" className={inputCls} />
        </div>
        <div>
          <Label htmlFor="ext-lugToLug" className={fieldLabel}>{t("lugToLug")}</Label>
          <Input id="ext-lugToLug" value={fields.lugToLug} onChange={(e) => set("lugToLug", e.target.value)} type="number" step="0.1" className={inputCls} />
        </div>
        <div>
          <Label htmlFor="ext-thickness" className={fieldLabel}>{t("thickness")}</Label>
          <Input id="ext-thickness" value={fields.thickness} onChange={(e) => set("thickness", e.target.value)} type="number" step="0.1" className={inputCls} />
        </div>
        <div>
          <Label htmlFor="ext-movement" className={fieldLabel}>{t("row.movement")}</Label>
          <Input id="ext-movement" value={fields.movement} onChange={(e) => set("movement", e.target.value)} placeholder="Automatic" className={inputCls} />
        </div>
        <div>
          <Label htmlFor="ext-waterResistance" className={fieldLabel}>{t("waterResistance")}</Label>
          <Input id="ext-waterResistance" value={fields.waterResistance} onChange={(e) => set("waterResistance", e.target.value)} type="number" className={inputCls} />
        </div>
        <div>
          <Label htmlFor="ext-price" className={fieldLabel}>{t("priceEur")}</Label>
          <Input id="ext-price" value={fields.price} onChange={(e) => set("price", e.target.value)} type="number" step="0.01" placeholder="199" className={inputCls} />
        </div>
        <div>
          <Label htmlFor="ext-link" className={fieldLabel}>{t("listingLink")}</Label>
          <Input id="ext-link" value={fields.link} onChange={(e) => set("link", e.target.value)} type="url" placeholder="https://…" className={inputCls} />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="ext-image" className={fieldLabel}>{t("imageUrl")}</Label>
          <div className="flex items-start gap-3">
            <Input id="ext-image" value={fields.image} onChange={(e) => set("image", e.target.value)} type="url" placeholder={t("imageUrlPlaceholder")} className={inputCls} />
            {fields.image.trim() && (
              <div className="w-14 h-14 shrink-0 rounded-sm overflow-hidden border border-border bg-secondary">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={fields.image} alt="" className="w-full h-full object-cover" />
              </div>
            )}
          </div>
        </div>
      </div>

      <div>
        <Label className={fieldLabel}>{t("primaryStyleRequired")}</Label>
        <div className="flex flex-wrap gap-2">
          {PRIMARY_STYLES.map((s) => (
            <button
              type="button"
              key={s}
              onClick={() => setStyle(s)}
              className={[
                "px-3 py-1.5 rounded-sm border text-sm transition-colors",
                style === s ? "border-primary text-primary bg-primary/5" : "border-border text-muted-foreground hover:border-foreground/30",
              ].join(" ")}
            >
              {tLabels(`primaryStyle.${s}`)}
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label className={fieldLabel}>{t("occasionTagsRequired")}</Label>
        <div className="flex flex-wrap gap-2">
          {OCCASION_TAGS.map((tag) => {
            const active = tags.includes(tag)
            return (
              <button
                type="button"
                key={tag}
                onClick={() => setTags((prev) => (active ? prev.filter((x) => x !== tag) : [...prev, tag]))}
                className={[
                  "px-3 py-1.5 rounded-sm border text-sm transition-colors",
                  active ? "border-primary text-primary bg-primary/5" : "border-border text-muted-foreground hover:border-foreground/30",
                ].join(" ")}
              >
                {tLabels(`occasionTag.${tag}`)}
              </button>
            )
          })}
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex items-center gap-3">
        <button type="submit" className="px-6 py-2.5 bg-primary text-primary-foreground text-[10px] tracking-[0.18em] uppercase font-sans rounded-sm hover:bg-primary/90">
          {t("addToComparison")}
        </button>
        <button type="button" onClick={onCancel} className="text-[10px] tracking-[0.18em] uppercase font-sans text-muted-foreground hover:text-foreground">
          {t("cancel")}
        </button>
      </div>
    </form>
  )
}
