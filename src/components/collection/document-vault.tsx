"use client"

import { useActionState, useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import {
  deleteDocument,
  getDocumentUrl,
  uploadDocument,
  type DocActionResult,
} from "@/lib/documents/actions"
import type { WatchDocument } from "@/lib/db/schema"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const DOC_TYPES = ["warranty", "receipt", "insurance", "other"] as const

function fmtSize(bytes: number | null) {
  if (!bytes) return ""
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function DocumentVault({
  userWatchId,
  documents,
  storageConfigured,
}: {
  userWatchId: string
  documents: WatchDocument[]
  storageConfigured: boolean
}) {
  const t = useTranslations("Document")
  const router = useRouter()
  const action = uploadDocument.bind(null, userWatchId)
  const [state, formAction, pending] = useActionState<DocActionResult | undefined, FormData>(
    action,
    undefined
  )
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  useEffect(() => {
    if (state?.ok) router.refresh()
  }, [state, router])

  function view(id: string) {
    startTransition(async () => {
      const res = await getDocumentUrl(id)
      if (res.url) window.open(res.url, "_blank", "noopener,noreferrer")
    })
  }

  function remove(id: string) {
    setDeletingId(id)
    startTransition(async () => {
      await deleteDocument(id)
      setDeletingId(null)
      router.refresh()
    })
  }

  return (
    <div className="rounded-sm border border-border bg-card p-6">
      <div className="flex items-center justify-between mb-1">
        <p className="label-gold-caps">{t("documentVault")}</p>
        <span className="label-caps">{t("alwaysPrivate")}</span>
      </div>
      <p className="text-xs text-muted-foreground mb-5">
        {t("vaultHint")}
      </p>

      {documents.length > 0 && (
        <div className="space-y-2 mb-5">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between gap-4 rounded-sm border border-border bg-background px-4 py-3"
            >
              <div className="min-w-0">
                <p className="text-sm text-foreground truncate">{doc.fileName}</p>
                <p className="label-caps mt-0.5">
                  {t(`type.${doc.docType}`)} · {fmtSize(doc.size)}
                </p>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <button
                  onClick={() => view(doc.id)}
                  className="text-[10px] tracking-[0.18em] uppercase font-sans text-primary hover:opacity-80"
                >
                  {t("view")}
                </button>
                <button
                  onClick={() => remove(doc.id)}
                  disabled={deletingId === doc.id}
                  className="text-[10px] tracking-[0.18em] uppercase font-sans text-muted-foreground hover:text-destructive disabled:opacity-50"
                >
                  {deletingId === doc.id ? "…" : t("delete")}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {storageConfigured ? (
        <form action={formAction} className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
          <div className="flex-1">
            <label className="label-caps mb-1.5 block">{t("fileHint")}</label>
            <input
              type="file"
              name="file"
              accept="application/pdf,image/*"
              required
              className="block w-full text-sm text-muted-foreground file:mr-3 file:py-2 file:px-4 file:rounded-sm file:border file:border-border file:bg-secondary file:text-foreground file:text-xs file:cursor-pointer"
            />
          </div>
          <div className="w-36">
            <label className="label-caps mb-1.5 block">{t("type.label")}</label>
            <Select name="docType" defaultValue="warranty">
              <SelectTrigger className="h-9 w-full bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DOC_TYPES.map((value) => (
                  <SelectItem key={value} value={value}>{t(`type.${value}`)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <button
            type="submit"
            disabled={pending}
            className="h-9 px-5 bg-primary text-primary-foreground text-[10px] tracking-[0.18em] uppercase font-sans rounded-sm hover:bg-primary/90 disabled:opacity-50"
          >
            {pending ? t("uploading") : t("upload")}
          </button>
        </form>
      ) : (
        <p className="text-sm text-muted-foreground border border-dashed border-border rounded-sm p-4">
          {t.rich("storageNotConfigured", {
            code: (chunks) => <code className="text-xs">{chunks}</code>,
          })}
        </p>
      )}

      {state?.error && <p className="text-sm text-destructive mt-3">{state.error}</p>}
    </div>
  )
}
