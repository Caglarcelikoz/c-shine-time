"use server"

import { createId } from "@paralleldrive/cuid2"
import { requireUser } from "@/lib/auth/session"
import {
  isImageStorageConfigured,
  publicImageUrl,
  uploadPublicImage,
} from "@/lib/storage/r2"

/**
 * Watch images (ADR 0002) — stored in the PUBLIC R2 bucket with unguessable
 * cuid keys. Clients downscale to ~1600px JPEG before calling this, so 5 MB
 * is generous headroom, not the expected size.
 */
const MAX_SIZE = 5 * 1024 * 1024
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"])

export type ImageUploadResult = { ok: boolean; url?: string; error?: string }

export async function uploadWatchImage(
  formData: FormData
): Promise<ImageUploadResult> {
  const user = await requireUser()

  if (!isImageStorageConfigured()) {
    return { ok: false, error: "Image storage isn't configured yet." }
  }

  const file = formData.get("file")
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Choose an image to upload." }
  }
  if (file.size > MAX_SIZE) {
    return { ok: false, error: "Image must be 5 MB or smaller." }
  }
  if (!ALLOWED.has(file.type)) {
    return { ok: false, error: "Only JPEG, PNG, or WebP images are allowed." }
  }

  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg"
  const key = `watch-images/${user.id}/${createId()}.${ext}`

  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    await uploadPublicImage(key, buffer, file.type)
  } catch (err) {
    console.error("uploadWatchImage storage error:", err)
    return { ok: false, error: "Upload failed. Check your storage credentials." }
  }

  return { ok: true, url: publicImageUrl(key) }
}
