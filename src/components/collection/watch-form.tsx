"use client"

import { useActionState, useState } from "react"
import { useTranslations } from "next-intl"
import { Link } from "@/i18n/navigation"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { ChevronDownIcon } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  OCCASION_TAGS,
  PRIMARY_STYLES,
  TIME_HORIZONS,
  WISHLIST_STATUS_LABELS_VALUES,
} from "@/lib/types"
import type { CollectionItem } from "@/lib/types"
import type { ActionState } from "@/lib/definitions"
import { fmtDateInput, fmtNum } from "@/lib/format"
import { MATERIAL_OPTIONS, MOVEMENT_OPTIONS } from "@/lib/collection/options"
import { CURRENCIES, DEFAULT_CURRENCY } from "@/lib/currency"
import { ImageField } from "./image-field"
import { CatalogSearch } from "./catalog-search"
import { getCatalogEntry } from "@/lib/catalog/actions"

type FormAction = (
  state: ActionState,
  formData: FormData
) => Promise<ActionState>

/**
 * Loose defaults: a full CollectionItem when editing, or a partial pre-fill
 * (photo capture / URL import) when adding.
 */
export type WatchFormDefaults = Partial<Omit<CollectionItem, "watch">> & {
  watch?: Partial<CollectionItem["watch"]>
}

interface WatchFormProps {
  action: FormAction
  defaultValues?: WatchFormDefaults
  submitLabel: string
  cancelHref: string
  variant?: "owned" | "wishlist"
  /** Whether the public images bucket is configured (server-decided). */
  imageUploadEnabled?: boolean
}

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null
  return <p className="text-xs text-destructive mt-1">{errors[0]}</p>
}

const sectionLabel = "label-gold-caps block mb-5"
const fieldLabel = "label-caps mb-1.5 block"
const inputCls = "bg-card border-border"

/** Map a catalog reference row onto the form's loose defaults shape. */
function fromCatalogEntry(entry: NonNullable<Awaited<ReturnType<typeof getCatalogEntry>>>): WatchFormDefaults {
  return {
    watch: {
      brand: entry.brand,
      model: entry.model,
      reference: entry.reference,
      year: entry.year,
      caseSize: entry.caseSize,
      thickness: entry.thickness,
      lugToLug: entry.lugToLug,
      movementType: entry.movementType,
      dialColor: entry.dialColor,
      material: entry.material,
      waterResistance: entry.waterResistance,
    },
    primaryStyle: entry.primaryStyle,
    occasionTags: entry.occasionTags,
  }
}

export function WatchForm({
  action,
  defaultValues,
  submitLabel,
  cancelHref,
  variant = "owned",
  imageUploadEnabled = false,
}: WatchFormProps) {
  const t = useTranslations("WatchForm")
  const tLabels = useTranslations("Labels")
  const [state, formAction, pending] = useActionState(action, undefined)
  const errors = state?.errors ?? {}

  // Catalog pick overrides the incoming defaults (photo/URL prefill or an
  // existing item on edit); formKey remounts the uncontrolled inputs below
  // since they only read defaultValue on mount.
  const [catalogOverride, setCatalogOverride] = useState<WatchFormDefaults | null>(null)
  const [formKey, setFormKey] = useState(0)

  async function handleCatalogSelect(entryId: string) {
    const entry = await getCatalogEntry(entryId)
    if (!entry) return
    setCatalogOverride(fromCatalogEntry(entry))
    setFormKey((k) => k + 1)
  }

  const merged = catalogOverride
    ? { ...defaultValues, ...catalogOverride, watch: { ...defaultValues?.watch, ...catalogOverride.watch } }
    : defaultValues
  const w = merged?.watch
  const uw = merged
  const isWishlist = variant === "wishlist"

  return (
    <form key={formKey} action={formAction} className="space-y-12 max-w-3xl">
      {/* Identity */}
      <section>
        <span className={sectionLabel}>{t("identity")}</span>
        <div className="mb-5">
          <CatalogSearch onSelect={handleCatalogSelect} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <Label htmlFor="brand" className={fieldLabel}>{t("brand")} *</Label>
            <Input id="brand" name="brand" defaultValue={w?.brand ?? ""} className={inputCls} />
            <FieldError errors={errors.brand} />
          </div>
          <div>
            <Label htmlFor="model" className={fieldLabel}>{t("model")} *</Label>
            <Input id="model" name="model" defaultValue={w?.model ?? ""} className={inputCls} />
            <FieldError errors={errors.model} />
          </div>
          <div>
            <Label htmlFor="reference" className={fieldLabel}>{t("reference")}</Label>
            <Input id="reference" name="reference" defaultValue={w?.reference ?? ""} className={inputCls} />
          </div>
          <div>
            <Label htmlFor="year" className={fieldLabel}>{t("year")}</Label>
            <Input id="year" name="year" type="number" defaultValue={w?.year ?? ""} className={inputCls} />
            <FieldError errors={errors.year} />
          </div>
          <div className="sm:col-span-2">
            <ImageField
              defaultUrls={w?.imageUrls ?? []}
              uploadEnabled={imageUploadEnabled}
              errors={errors.imageUrls}
            />
          </div>
        </div>
      </section>

      {/* Specs */}
      <section>
        <span className={sectionLabel}>{t("specifications")}</span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div>
            <Label htmlFor="caseSize" className={fieldLabel}>{t("caseSize")}</Label>
            <Input id="caseSize" name="caseSize" type="number" step="0.1" defaultValue={fmtNum(w?.caseSize)} className={inputCls} />
            <FieldError errors={errors.caseSize} />
          </div>
          <div>
            <Label htmlFor="thickness" className={fieldLabel}>{t("thickness")}</Label>
            <Input id="thickness" name="thickness" type="number" step="0.1" defaultValue={fmtNum(w?.thickness)} className={inputCls} />
            <FieldError errors={errors.thickness} />
          </div>
          <div>
            <Label htmlFor="lugToLug" className={fieldLabel}>{t("lugToLug")}</Label>
            <Input id="lugToLug" name="lugToLug" type="number" step="0.1" defaultValue={fmtNum(w?.lugToLug)} className={inputCls} />
            <FieldError errors={errors.lugToLug} />
          </div>
          <div>
            <Label htmlFor="movementType" className={fieldLabel}>{t("movement")}</Label>
            <div className="relative">
              <Input
                id="movementType"
                name="movementType"
                list="movement-options"
                defaultValue={w?.movementType ?? ""}
                className={`${inputCls} pr-8`}
              />
              <ChevronDownIcon className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            </div>
            <datalist id="movement-options">
              {MOVEMENT_OPTIONS.map((m) => (
                <option key={m} value={m} />
              ))}
            </datalist>
            <p className="text-xs text-muted-foreground mt-1">{t("movementHint")}</p>
          </div>
          <div>
            <Label htmlFor="dialColor" className={fieldLabel}>{t("dialColor")}</Label>
            <Input id="dialColor" name="dialColor" defaultValue={w?.dialColor ?? ""} className={inputCls} />
            <p className="text-xs text-muted-foreground mt-1">{t("dialColorHint")}</p>
          </div>
          <div>
            <Label htmlFor="material" className={fieldLabel}>{t("material")}</Label>
            <Select name="material" defaultValue={w?.material ?? ""}>
              <SelectTrigger id="material" className="h-9 w-full bg-card">
                <SelectValue placeholder={t("selectPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {MATERIAL_OPTIONS.map((m) => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="waterResistance" className={fieldLabel}>{t("waterResistance")}</Label>
            <Input id="waterResistance" name="waterResistance" type="number" defaultValue={w?.waterResistance ?? ""} className={inputCls} />
            <FieldError errors={errors.waterResistance} />
          </div>
        </div>
      </section>

      {/* Classification — mandatory */}
      <section>
        <span className={sectionLabel}>{t("classification")}</span>

        <div className="mb-7">
          <Label className={fieldLabel}>{t("primaryStyle")} *</Label>
          <div className="flex flex-wrap gap-2">
            {PRIMARY_STYLES.map((style) => (
              <label key={style} className="cursor-pointer">
                <input
                  type="radio"
                  name="primaryStyle"
                  value={style}
                  defaultChecked={uw?.primaryStyle === style}
                  className="peer sr-only"
                />
                <span className="inline-block px-4 py-2 rounded-sm border border-border text-sm text-muted-foreground transition-colors peer-checked:border-primary peer-checked:text-primary peer-checked:bg-primary/5 hover:border-foreground/30">
                  {tLabels(`primaryStyle.${style}`)}
                </span>
              </label>
            ))}
          </div>
          <FieldError errors={errors.primaryStyle} />
        </div>

        <div className="mb-7">
          <Label className={fieldLabel}>{t("secondaryStyle")}</Label>
          <div className="flex flex-wrap gap-2">
            <label className="cursor-pointer">
              <input
                type="radio"
                name="secondaryStyle"
                value=""
                defaultChecked={!uw?.secondaryStyle}
                className="peer sr-only"
              />
              <span className="inline-block px-4 py-2 rounded-sm border border-border text-sm text-muted-foreground transition-colors peer-checked:border-primary peer-checked:text-primary peer-checked:bg-primary/5 hover:border-foreground/30">
                {t("none")}
              </span>
            </label>
            {PRIMARY_STYLES.map((style) => (
              <label key={style} className="cursor-pointer">
                <input
                  type="radio"
                  name="secondaryStyle"
                  value={style}
                  defaultChecked={uw?.secondaryStyle === style}
                  className="peer sr-only"
                />
                <span className="inline-block px-4 py-2 rounded-sm border border-border text-sm text-muted-foreground transition-colors peer-checked:border-primary peer-checked:text-primary peer-checked:bg-primary/5 hover:border-foreground/30">
                  {tLabels(`primaryStyle.${style}`)}
                </span>
              </label>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-1">{t("secondaryStyleHint")}</p>
        </div>

        <div>
          <Label className={fieldLabel}>{t("occasionTags")}</Label>
          <div className="flex flex-wrap gap-2">
            {OCCASION_TAGS.map((tag) => (
              <label key={tag} className="cursor-pointer">
                <input
                  type="checkbox"
                  name="occasionTags"
                  value={tag}
                  defaultChecked={uw?.occasionTags?.includes(tag)}
                  className="peer sr-only"
                />
                <span className="inline-block px-4 py-2 rounded-sm border border-border text-sm text-muted-foreground transition-colors peer-checked:border-primary peer-checked:text-primary peer-checked:bg-primary/5 hover:border-foreground/30">
                  {tLabels(`occasionTag.${tag}`)}
                </span>
              </label>
            ))}
          </div>
          <FieldError errors={errors.occasionTags} />
        </div>
      </section>

      {/* Ownership / Acquisition plan */}
      {isWishlist ? (
        <section>
          <span className={sectionLabel}>{t("acquisitionPlan")}</span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-7">
            <div>
              <Label className={fieldLabel}>{t("currency")}</Label>
              <Select name="currency" defaultValue={uw?.currency ?? DEFAULT_CURRENCY}>
                <SelectTrigger className="h-9 w-full bg-card">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="targetPrice" className={fieldLabel}>{t("targetPrice")}</Label>
              <Input id="targetPrice" name="targetPrice" type="number" step="0.01" defaultValue={fmtNum(uw?.targetPrice)} className={inputCls} />
              <FieldError errors={errors.targetPrice} />
            </div>
          </div>

          <div className="mb-7">
            <Label className={fieldLabel}>{t("timeHorizon")} *</Label>
            <div className="flex flex-wrap gap-2">
              {TIME_HORIZONS.map((h) => (
                <label key={h} className="cursor-pointer">
                  <input
                    type="radio"
                    name="timeHorizon"
                    value={h}
                    defaultChecked={(uw?.timeHorizon ?? "mid") === h}
                    className="peer sr-only"
                  />
                  <span className="inline-block px-4 py-2 rounded-sm border border-border text-sm text-muted-foreground transition-colors peer-checked:border-primary peer-checked:text-primary peer-checked:bg-primary/5 hover:border-foreground/30">
                    {tLabels(`timeHorizon.${h}`)}
                    <span className="block text-[10px] opacity-60">{tLabels(`timeHorizonSubtitle.${h}`)}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="mb-7">
            <Label className={fieldLabel}>{t("status")}</Label>
            <div className="flex flex-wrap gap-2">
              {WISHLIST_STATUS_LABELS_VALUES.map((s) => (
                <label key={s} className="cursor-pointer">
                  <input
                    type="radio"
                    name="wishlistStatusLabel"
                    value={s}
                    defaultChecked={(uw?.wishlistStatusLabel ?? "researching") === s}
                    className="peer sr-only"
                  />
                  <span className="inline-block px-4 py-2 rounded-sm border border-border text-sm text-muted-foreground transition-colors peer-checked:border-primary peer-checked:text-primary peer-checked:bg-primary/5 hover:border-foreground/30">
                    {tLabels(`wishlistStatus.${s}`)}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="wishlistReason" className={fieldLabel}>{t("reason")}</Label>
            <textarea
              id="wishlistReason"
              name="wishlistReason"
              defaultValue={uw?.wishlistReason ?? ""}
              rows={2}
              placeholder={t("reasonPlaceholder")}
              className="w-full rounded-sm border border-border bg-card px-3 py-2 text-sm text-foreground resize-y"
            />
          </div>
        </section>
      ) : (
        <section>
          <span className={sectionLabel}>{t("ownershipPrivate")}</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <Label className={fieldLabel}>{t("currency")}</Label>
              <Select name="currency" defaultValue={uw?.currency ?? DEFAULT_CURRENCY}>
                <SelectTrigger className="h-9 w-full bg-card">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">{t("currencyHint")}</p>
            </div>
            <div className="hidden sm:block" aria-hidden />
            <div>
              <Label htmlFor="purchasePrice" className={fieldLabel}>{t("purchasePrice")}</Label>
              <Input id="purchasePrice" name="purchasePrice" type="number" step="0.01" defaultValue={fmtNum(uw?.purchasePrice)} className={inputCls} />
              <FieldError errors={errors.purchasePrice} />
            </div>
            <div>
              <Label htmlFor="purchaseDate" className={fieldLabel}>{t("purchaseDate")}</Label>
              <Input id="purchaseDate" name="purchaseDate" type="date" defaultValue={fmtDateInput(uw?.purchaseDate)} className={inputCls} />
            </div>
            <div>
              <Label htmlFor="marketValueEstimate" className={fieldLabel}>{t("marketValueEstimate")}</Label>
              <Input id="marketValueEstimate" name="marketValueEstimate" type="number" step="0.01" defaultValue={fmtNum(uw?.marketValueEstimate)} className={inputCls} />
              <FieldError errors={errors.marketValueEstimate} />
            </div>
            <div>
              <Label htmlFor="serialNumber" className={fieldLabel}>{t("serialNumber")}</Label>
              <Input id="serialNumber" name="serialNumber" defaultValue={uw?.serialNumber ?? ""} placeholder={t("serialNumberPlaceholder")} className={inputCls} />
              <p className="text-xs text-muted-foreground mt-1">{t("serialNumberHint")}</p>
            </div>
          </div>
        </section>
      )}

      {/* Narrative */}
      <section>
        <span className={sectionLabel}>{t("story")}</span>
        <div className="space-y-5">
          <div>
            <Label htmlFor="story" className={fieldLabel}>{t("story")}</Label>
            <textarea
              id="story"
              name="story"
              defaultValue={uw?.story ?? ""}
              rows={3}
              placeholder={t("storyPlaceholder")}
              className="w-full rounded-sm border border-border bg-card px-3 py-2 text-sm text-foreground resize-y"
            />
          </div>
          <div>
            <Label htmlFor="notes" className={fieldLabel}>{t("notes")}</Label>
            <textarea
              id="notes"
              name="notes"
              defaultValue={uw?.notes ?? ""}
              rows={2}
              placeholder={t("notesPlaceholder")}
              className="w-full rounded-sm border border-border bg-card px-3 py-2 text-sm text-foreground resize-y"
            />
          </div>
        </div>
      </section>

      {/* Privacy — owned only */}
      {!isWishlist && (
        <section>
          <span className={sectionLabel}>{t("privacy")}</span>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="isPublic"
              defaultChecked={uw?.isPublic ?? false}
              className="peer sr-only"
            />
            <span className="w-9 h-5 rounded-full bg-secondary border border-border relative transition-colors peer-checked:bg-primary/30 peer-checked:border-primary/50 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-3.5 after:h-3.5 after:rounded-full after:bg-muted-foreground after:transition-transform peer-checked:after:translate-x-4 peer-checked:after:bg-primary" />
            <span className="text-sm text-foreground">{t("showOnPublicProfile")}</span>
          </label>
        </section>
      )}

      {state?.message && (
        <p className="text-sm text-destructive">{state.message}</p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 pt-4 border-t border-border">
        <Button
          type="submit"
          disabled={pending}
          className="bg-primary text-primary-foreground hover:bg-primary/90 text-[10px] tracking-[0.18em] uppercase px-7"
        >
          {pending ? t("saving") : submitLabel}
        </Button>
        <Link
          href={cancelHref}
          className="text-[10px] tracking-[0.18em] uppercase font-sans text-muted-foreground hover:text-foreground transition-colors"
        >
          {t("cancel")}
        </Link>
      </div>
    </form>
  )
}
