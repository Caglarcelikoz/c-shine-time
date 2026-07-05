import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

export const R2_BUCKET = process.env.R2_BUCKET || ""

/**
 * Public bucket for watch images (ADR 0002) — served via its r2.dev or custom
 * domain with unguessable cuid keys. Documents NEVER go here; they stay in the
 * private bucket behind signed GETs.
 */
export const R2_PUBLIC_BUCKET = process.env.R2_PUBLIC_BUCKET || ""
const R2_PUBLIC_URL = (process.env.R2_PUBLIC_URL || "").replace(/\/+$/, "")

/** True only when all R2 credentials are present. */
export function isStorageConfigured(): boolean {
  return Boolean(
    process.env.R2_ACCOUNT_ID &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      process.env.R2_BUCKET
  )
}

/** True only when the public images bucket + its serving domain are configured. */
export function isImageStorageConfigured(): boolean {
  return Boolean(
    process.env.R2_ACCOUNT_ID &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      R2_PUBLIC_BUCKET &&
      R2_PUBLIC_URL
  )
}

let _client: S3Client | null = null
function client(): S3Client {
  if (!_client) {
    _client = new S3Client({
      region: "auto",
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
    })
  }
  return _client
}

export async function uploadObject(
  key: string,
  body: Buffer | Uint8Array,
  contentType: string
): Promise<void> {
  await client().send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  )
}

/** Short-lived signed GET URL — the only way documents are ever served. */
export async function signedGetUrl(key: string, expiresIn = 300): Promise<string> {
  return getSignedUrl(
    client(),
    new GetObjectCommand({ Bucket: R2_BUCKET, Key: key }),
    { expiresIn }
  )
}

export async function deleteObject(key: string): Promise<void> {
  await client().send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: key }))
}

// ── Public images bucket (watch photos only — ADR 0002) ────────────────────

export async function uploadPublicImage(
  key: string,
  body: Buffer | Uint8Array,
  contentType: string
): Promise<void> {
  await client().send(
    new PutObjectCommand({
      Bucket: R2_PUBLIC_BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable",
    })
  )
}

/** Stable public URL for a stored image key. */
export function publicImageUrl(key: string): string {
  return `${R2_PUBLIC_URL}/${key}`
}

/**
 * Reverse of publicImageUrl: the storage key if this URL points at our public
 * bucket, else null. Lets delete flows clean up only R2-hosted images while
 * leaving pasted external URLs untouched.
 */
export function publicImageKeyFromUrl(url: string): string | null {
  if (!R2_PUBLIC_URL || !url.startsWith(`${R2_PUBLIC_URL}/`)) return null
  return url.slice(R2_PUBLIC_URL.length + 1) || null
}

export async function deletePublicImage(key: string): Promise<void> {
  await client().send(
    new DeleteObjectCommand({ Bucket: R2_PUBLIC_BUCKET, Key: key })
  )
}
