/**
 * Client-side image downscaling (ADR 0002) — phone photos are 4–10 MB; we
 * resize in the browser to ~1600px JPEG (~200–400 KB) before upload so the
 * same small image feeds both R2 and the vision call. Browser-only: import
 * from client components.
 */

const MAX_DIMENSION = 1600
const JPEG_QUALITY = 0.82

/**
 * Downscale an image file to a JPEG capped at `maxDim` on its longest side.
 * Uses createImageBitmap (EXIF orientation respected). Throws if the browser
 * can't decode the file — callers should surface "try a JPEG/PNG instead".
 */
export async function downscaleImage(
  file: File,
  maxDim = MAX_DIMENSION
): Promise<File> {
  const bitmap = await createImageBitmap(file, {
    imageOrientation: "from-image",
  })
  try {
    const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height))
    const width = Math.max(1, Math.round(bitmap.width * scale))
    const height = Math.max(1, Math.round(bitmap.height * scale))

    const canvas = document.createElement("canvas")
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext("2d")
    if (!ctx) throw new Error("Canvas unavailable")
    ctx.drawImage(bitmap, 0, 0, width, height)

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY)
    )
    if (!blob) throw new Error("Image encode failed")

    const baseName = file.name.replace(/\.[^.]+$/, "") || "photo"
    return new File([blob], `${baseName}.jpg`, { type: "image/jpeg" })
  } finally {
    bitmap.close()
  }
}
