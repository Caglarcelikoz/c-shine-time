"use server"

import { revalidatePath } from "next/cache"
import { and, eq } from "drizzle-orm"
import { createId } from "@paralleldrive/cuid2"
import { db } from "@/lib/db"
import { documents, userWatches } from "@/lib/db/schema"
import { requireUser } from "@/lib/auth/session"
import {
  deleteObject,
  isStorageConfigured,
  signedGetUrl,
  uploadObject,
} from "@/lib/storage/r2"
import type { WatchDocument } from "@/lib/db/schema"

const MAX_SIZE = 10 * 1024 * 1024 // 10 MB
const ALLOWED = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/heic",
])
const DOC_TYPES = new Set(["warranty", "receipt", "insurance", "other"])

export type DocActionResult = { ok: boolean; error?: string }

export async function uploadDocument(
  userWatchId: string,
  _prev: DocActionResult | undefined,
  formData: FormData
): Promise<DocActionResult> {
  const user = await requireUser()

  if (!isStorageConfigured()) {
    return { ok: false, error: "Storage isn't configured yet." }
  }

  // Verify the watch belongs to this user.
  const [watch] = await db
    .select({ id: userWatches.id })
    .from(userWatches)
    .where(and(eq(userWatches.id, userWatchId), eq(userWatches.userId, user.id)))
    .limit(1)
  if (!watch) return { ok: false, error: "Watch not found." }

  const file = formData.get("file")
  const docType = String(formData.get("docType") ?? "other")
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Choose a file to upload." }
  }
  if (file.size > MAX_SIZE) return { ok: false, error: "File must be 10 MB or smaller." }
  if (file.type && !ALLOWED.has(file.type)) {
    return { ok: false, error: "Only PDF or image files are allowed." }
  }
  const type = DOC_TYPES.has(docType) ? docType : "other"

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120)
  const key = `documents/${user.id}/${userWatchId}/${createId()}-${safeName}`

  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    await uploadObject(key, buffer, file.type || "application/octet-stream")
  } catch (err) {
    console.error("uploadDocument storage error:", err)
    return { ok: false, error: "Upload failed. Check your storage credentials." }
  }

  await db.insert(documents).values({
    userId: user.id,
    userWatchId,
    docType: type as WatchDocument["docType"],
    fileName: file.name.slice(0, 200),
    storageKey: key,
    contentType: file.type || null,
    size: file.size,
  })

  revalidatePath(`/collection/${userWatchId}`)
  return { ok: true }
}

/** Returns a short-lived signed URL for viewing a document (owner only). */
export async function getDocumentUrl(id: string): Promise<{ url?: string; error?: string }> {
  const user = await requireUser()
  const [doc] = await db
    .select({ storageKey: documents.storageKey })
    .from(documents)
    .where(and(eq(documents.id, id), eq(documents.userId, user.id)))
    .limit(1)
  if (!doc) return { error: "Not found." }
  try {
    return { url: await signedGetUrl(doc.storageKey) }
  } catch {
    return { error: "Couldn't generate a link." }
  }
}

export async function deleteDocument(id: string): Promise<void> {
  const user = await requireUser()
  const [doc] = await db
    .select()
    .from(documents)
    .where(and(eq(documents.id, id), eq(documents.userId, user.id)))
    .limit(1)
  if (!doc) return
  try {
    await deleteObject(doc.storageKey)
  } catch (err) {
    console.error("deleteDocument storage error:", err)
  }
  await db.delete(documents).where(eq(documents.id, id))
  revalidatePath(`/collection/${doc.userWatchId}`)
}

export async function getDocuments(
  userWatchId: string,
  userId: string
): Promise<WatchDocument[]> {
  return db
    .select()
    .from(documents)
    .where(
      and(eq(documents.userWatchId, userWatchId), eq(documents.userId, userId))
    )
}
