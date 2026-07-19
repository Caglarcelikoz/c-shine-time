import { createId } from "@paralleldrive/cuid2";
import { isSafePublicUrl } from "@/lib/net/safe-url";
import {
  publicImageKeyFromUrl,
  publicImageUrl,
  uploadPublicImage,
} from "@/lib/storage/r2";

/** Max bytes we'll pull from a remote listing image. */
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const FETCH_TIMEOUT_MS = 10_000;

/** Content-type → file extension for images we re-host. */
const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};

/** Thrown when a listing image can't be re-hosted, so the save can block. */
export class RehostError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RehostError";
  }
}

/**
 * True when `url` is a public external image we should re-host: a valid public
 * http(s) URL that is not already served from our own public bucket. Our own
 * URLs and non-public/malformed URLs are left for the caller to keep or reject.
 */
export function needsRehost(url: string): boolean {
  return isSafePublicUrl(url) && publicImageKeyFromUrl(url) === null;
}

/**
 * Fetch one external image and store it in the public bucket, returning our
 * stable URL. Throws {@link RehostError} on any fetch/type/size failure — the
 * save path turns that into a blocking form error (grilling Q4 = block).
 */
async function rehostOne(sourceUrl: string, userId: string): Promise<string> {
  if (!isSafePublicUrl(sourceUrl)) {
    throw new RehostError("The image URL isn't a valid public link.");
  }

  let res: Response;
  try {
    res = await fetch(sourceUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        Accept: "image/*",
      },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
  } catch {
    throw new RehostError("Couldn't download the listing image.");
  }

  if (!res.ok) {
    throw new RehostError(
      `Couldn't download the listing image (HTTP ${res.status}).`,
    );
  }

  const contentType = (res.headers.get("content-type") || "")
    .split(";")[0]
    .trim()
    .toLowerCase();
  const ext = EXT_BY_TYPE[contentType];
  if (!ext) {
    throw new RehostError("That link doesn't point to a supported image.");
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  if (buffer.byteLength === 0) {
    throw new RehostError("The listing image was empty.");
  }
  if (buffer.byteLength > MAX_IMAGE_BYTES) {
    throw new RehostError("The listing image is larger than 8 MB.");
  }

  const key = `watch-images/${userId}/${createId()}.${ext}`;
  try {
    await uploadPublicImage(key, buffer, contentType);
  } catch {
    throw new RehostError("Couldn't save the listing image. Try again.");
  }
  return publicImageUrl(key);
}

/**
 * Re-host any external image URLs to our public bucket, preserving order and
 * leaving already-hosted URLs untouched. Throws {@link RehostError} if any
 * external image can't be re-hosted so the caller can block the save.
 */
export async function rehostExternalImages(
  urls: string[],
  userId: string,
): Promise<string[]> {
  const out: string[] = [];
  for (const url of urls) {
    out.push(needsRehost(url) ? await rehostOne(url, userId) : url);
  }
  return out;
}
