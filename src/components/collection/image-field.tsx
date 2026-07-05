"use client"

import { useRef, useState } from "react"
import { useTranslations } from "next-intl"
import { StarIcon, XIcon, UploadIcon, PlusIcon } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { downscaleImage } from "@/lib/images/downscale"
import { uploadWatchImage } from "@/lib/images/actions"

export const MAX_PHOTOS = 5

interface ImageFieldProps {
  defaultUrls: string[]
  /** Whether the public images bucket is configured (server-decided). */
  uploadEnabled: boolean
  errors?: string[]
}

/**
 * Multi-photo field (ADR 0002/0003): up to 5 images per watch, index 0 is the
 * primary shown on cards/compare/PDF/public profile. Sources: file upload
 * (client-downscaled → R2 public bucket) or pasted URL. Submits as repeated
 * hidden `imageUrls` inputs read via formData.getAll().
 */
export function ImageField({ defaultUrls, uploadEnabled, errors }: ImageFieldProps) {
  const t = useTranslations("ImageField")
  const [urls, setUrls] = useState<string[]>(defaultUrls.slice(0, MAX_PHOTOS))
  const [urlDraft, setUrlDraft] = useState("")
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const full = urls.length >= MAX_PHOTOS

  async function onFiles(files: FileList | null) {
    if (!files?.length) return
    setError(null)
    setUploading(true)
    try {
      for (const file of Array.from(files).slice(0, MAX_PHOTOS - urls.length)) {
        let small: File
        try {
          small = await downscaleImage(file)
        } catch {
          setError(t("couldntReadImage"))
          continue
        }
        const fd = new FormData()
        fd.set("file", small)
        const res = await uploadWatchImage(fd)
        if (res.ok && res.url) {
          setUrls((prev) =>
            prev.length < MAX_PHOTOS ? [...prev, res.url!] : prev
          )
        } else {
          setError(res.error ?? t("uploadFailed"))
        }
      }
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ""
    }
  }

  function addUrl() {
    const raw = urlDraft.trim()
    if (!raw || full || urls.includes(raw)) return
    try {
      new URL(raw)
    } catch {
      setError(t("enterValidUrl"))
      return
    }
    setError(null)
    setUrls((prev) => [...prev, raw])
    setUrlDraft("")
  }

  function remove(index: number) {
    setUrls((prev) => prev.filter((_, i) => i !== index))
  }

  function makePrimary(index: number) {
    setUrls((prev) => [prev[index], ...prev.filter((_, i) => i !== index)])
  }

  return (
    <div>
      <Label className="label-caps mb-1.5 block">
        {t("photos")} <span className="normal-case tracking-normal">({urls.length}/{MAX_PHOTOS})</span>
      </Label>

      {/* Submitted values */}
      {urls.map((u) => (
        <input key={u} type="hidden" name="imageUrls" value={u} />
      ))}

      {/* Thumbnail strip */}
      {urls.length > 0 && (
        <div className="flex flex-wrap gap-3 mb-3">
          {urls.map((u, i) => (
            <div
              key={u}
              className={`relative w-24 h-24 rounded-sm border overflow-hidden group ${
                i === 0 ? "border-primary/60" : "border-border"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={u} alt="" className="w-full h-full object-cover" />
              {i === 0 && (
                <span className="absolute bottom-0 inset-x-0 bg-background/85 text-primary text-[9px] tracking-widest uppercase text-center py-0.5">
                  {t("primary")}
                </span>
              )}
              <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
                {i > 0 && (
                  <button
                    type="button"
                    onClick={() => makePrimary(i)}
                    title={t("makePrimary")}
                    className="p-1 rounded-sm bg-background/85 text-muted-foreground hover:text-primary"
                  >
                    <StarIcon className="size-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => remove(i)}
                  title={t("removePhoto")}
                  className="p-1 rounded-sm bg-background/85 text-muted-foreground hover:text-destructive"
                >
                  <XIcon className="size-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sources: upload + URL */}
      <div className="flex flex-col sm:flex-row gap-2">
        {uploadEnabled && (
          <>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic"
              multiple
              className="sr-only"
              onChange={(e) => onFiles(e.target.files)}
            />
            <button
              type="button"
              disabled={uploading || full}
              onClick={() => fileRef.current?.click()}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-sm border border-border text-sm text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <UploadIcon className="size-4" />
              {uploading ? t("uploading") : t("uploadPhotos")}
            </button>
          </>
        )}
        <div className="flex flex-1 gap-2">
          <Input
            value={urlDraft}
            onChange={(e) => setUrlDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                addUrl()
              }
            }}
            placeholder={t("urlPlaceholder")}
            disabled={full}
            className="bg-card border-border"
          />
          <button
            type="button"
            onClick={addUrl}
            disabled={full || !urlDraft.trim()}
            title={t("addImageUrl")}
            className="inline-flex items-center px-3 rounded-sm border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <PlusIcon className="size-4" />
          </button>
        </div>
      </div>

      {(error || errors?.length) && (
        <p className="text-xs text-destructive mt-1">{error ?? errors?.[0]}</p>
      )}
      <p className="text-xs text-muted-foreground mt-1">
        {uploadEnabled ? t("primaryHint") : t("noStorageHint")}
      </p>
    </div>
  )
}
