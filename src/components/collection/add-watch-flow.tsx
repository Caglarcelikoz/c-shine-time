"use client"

import { useRef, useState, useTransition } from "react"
import { useTranslations } from "next-intl"
import { CameraIcon, PencilLineIcon, SparklesIcon, XIcon } from "lucide-react"
import { WatchForm, type WatchFormDefaults } from "./watch-form"
import { downscaleImage } from "@/lib/images/downscale"
import { importWatchFromPhotos, type ImportedWatch } from "@/lib/ai/actions"
import type { ActionState } from "@/lib/definitions"

const MAX_CAPTURE_PHOTOS = 3

type FormAction = (
  state: ActionState,
  formData: FormData
) => Promise<ActionState>

interface AddWatchFlowProps {
  action: FormAction
  imageUploadEnabled: boolean
  /** Storage + OpenAI key both configured (server-decided). */
  photoCaptureEnabled: boolean
}

/** Map extracted specs onto the form's loose defaults shape. */
function toDefaults(w: ImportedWatch, imageUrls: string[]): WatchFormDefaults {
  return {
    watch: {
      brand: w.brand ?? "",
      model: w.model ?? "",
      caseSize: w.caseSize != null ? String(w.caseSize) : null,
      thickness: w.thickness != null ? String(w.thickness) : null,
      lugToLug: w.lugToLug != null ? String(w.lugToLug) : null,
      movementType: w.movement,
      dialColor: w.dialColor,
      waterResistance: w.waterResistance,
      imageUrls,
    },
    primaryStyle: w.primaryStyle,
    occasionTags: w.occasionTags,
    marketValueEstimate: w.price != null ? String(w.price) : null,
  }
}

/**
 * Photo-first add flow (ADR 0001): snap up to 3 photos → vision extraction
 * pre-fills the same manual form → user reviews and saves. Extraction is an
 * accelerator, never a gate.
 */
export function AddWatchFlow({
  action,
  imageUploadEnabled,
  photoCaptureEnabled,
}: AddWatchFlowProps) {
  const t = useTranslations("AddWatchFlow")
  const [mode, setMode] = useState<"photo" | "manual">(
    photoCaptureEnabled ? "photo" : "manual"
  )
  const [photos, setPhotos] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [prefill, setPrefill] = useState<WatchFormDefaults | null>(null)
  const [formKey, setFormKey] = useState(0)
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [extracting, startExtract] = useTransition()
  const fileRef = useRef<HTMLInputElement>(null)

  // The form shows in manual mode, or in photo mode once extraction resolved.
  const showForm = mode === "manual" || prefill !== null

  function addPhotos(files: FileList | null) {
    if (!files?.length) return
    setError(null)
    const next = [...photos, ...Array.from(files)].slice(0, MAX_CAPTURE_PHOTOS)
    setPhotos(next)
    setPreviews((prev) => {
      prev.forEach((u) => URL.revokeObjectURL(u))
      return next.map((f) => URL.createObjectURL(f))
    })
    if (fileRef.current) fileRef.current.value = ""
  }

  function removePhoto(index: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== index))
    setPreviews((prev) => {
      URL.revokeObjectURL(prev[index])
      return prev.filter((_, i) => i !== index)
    })
  }

  function extract() {
    setError(null)
    setNotice(null)
    startExtract(async () => {
      const fd = new FormData()
      try {
        for (const p of photos) fd.append("photos", await downscaleImage(p))
      } catch {
        setError(t("couldntReadPhoto"))
        return
      }
      const res = await importWatchFromPhotos(fd)

      if (res.ok && res.watch) {
        setPrefill(toDefaults(res.watch, res.imageUrls))
        setNotice(t("specsExtracted"))
        setFormKey((k) => k + 1)
      } else if (res.rejected) {
        // Confident not-a-watch: photos were discarded server-side.
        setError(res.error ?? t("doesntLookLikeWatch"))
        setPhotos([])
        setPreviews((prev) => {
          prev.forEach((u) => URL.revokeObjectURL(u))
          return []
        })
      } else if (res.imageUrls.length > 0) {
        // Transient AI failure: photos are kept — fill specs manually.
        setPrefill({ watch: { imageUrls: res.imageUrls } })
        setNotice(res.error ?? t("fillManually"))
        setFormKey((k) => k + 1)
      } else {
        setError(res.error ?? t("somethingWentWrong"))
      }
    })
  }

  return (
    <div className="space-y-10">
      {/* Entry mode toggle */}
      {photoCaptureEnabled && (
        <div className="flex gap-2">
          {(
            [
              { id: "photo", label: t("fromPhotos"), Icon: CameraIcon },
              { id: "manual", label: t("manualEntry"), Icon: PencilLineIcon },
            ] as const
          ).map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                setMode(id)
                setError(null)
              }}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-sm border text-sm transition-colors ${
                mode === id
                  ? "border-primary text-primary bg-primary/5"
                  : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
              }`}
            >
              <Icon className="size-4" />
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Photo capture panel */}
      {mode === "photo" && !showForm && (
        <div className="rounded-sm border border-border bg-card p-6 max-w-3xl">
          <p className="label-gold-caps mb-2">{t("snapIt")}</p>
          <p className="text-sm text-muted-foreground mb-5">
            {t("snapItHint", { max: MAX_CAPTURE_PHOTOS })}
          </p>

          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic"
            multiple
            className="sr-only"
            onChange={(e) => addPhotos(e.target.files)}
          />

          {previews.length > 0 && (
            <div className="flex flex-wrap gap-3 mb-5">
              {previews.map((src, i) => (
                <div
                  key={src}
                  className="relative w-28 h-28 rounded-sm border border-border overflow-hidden group"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removePhoto(i)}
                    title={t("removePhoto")}
                    className="absolute top-1 right-1 p-1 rounded-sm bg-background/85 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity"
                  >
                    <XIcon className="size-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={extracting || photos.length >= MAX_CAPTURE_PHOTOS}
              onClick={() => fileRef.current?.click()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-sm border border-border text-sm text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CameraIcon className="size-4" />
              {photos.length === 0 ? t("addPhotos") : t("addAnother")}
            </button>
            {photos.length > 0 && (
              <button
                type="button"
                disabled={extracting}
                onClick={extract}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground text-[10px] tracking-[0.18em] uppercase font-sans rounded-sm hover:bg-primary/90 transition-colors disabled:opacity-60"
              >
                <SparklesIcon className="size-4" />
                {extracting ? t("readingSpecs") : t("extractSpecs")}
              </button>
            )}
          </div>

          {error && <p className="text-sm text-destructive mt-4">{error}</p>}
        </div>
      )}

      {/* The one shared form — manual, or pre-filled by extraction */}
      {showForm && (
        <>
          {notice && (
            <div className="rounded-sm border border-primary/30 bg-primary/5 px-4 py-3 max-w-3xl">
              <p className="text-sm text-foreground flex items-center gap-2">
                <SparklesIcon className="size-4 text-primary shrink-0" />
                {notice}
              </p>
            </div>
          )}
          <WatchForm
            key={formKey}
            action={action}
            defaultValues={prefill ?? undefined}
            submitLabel={t("addToCollection")}
            cancelHref="/collection"
            imageUploadEnabled={imageUploadEnabled}
          />
        </>
      )}
    </div>
  )
}
