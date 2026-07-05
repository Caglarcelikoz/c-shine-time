"use server"

import { revalidatePath } from "next/cache"
import { getLocale } from "next-intl/server"
import { and, eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { userWatches, watches } from "@/lib/db/schema"
import { requireUser } from "@/lib/auth/session"
import { redirect } from "@/i18n/navigation"
import { deletePublicImage, publicImageKeyFromUrl } from "@/lib/storage/r2"
import { deriveCaseSizeBand, deriveColorFamily } from "./derive"
import { WatchFormSchema, rawFromFormData, type WatchFormValues } from "./schema"
import type { ActionState } from "@/lib/definitions"

/** Best-effort cleanup of R2-hosted images; pasted external URLs are ignored. */
async function deleteStoredImages(urls: string[]): Promise<void> {
  for (const url of urls) {
    const key = publicImageKeyFromUrl(url)
    if (!key) continue
    try {
      await deletePublicImage(key)
    } catch (err) {
      console.error("deleteStoredImages error:", err)
    }
  }
}

/** Shape catalog (watch) columns from validated form values. */
function watchValues(v: WatchFormValues) {
  return {
    brand: v.brand,
    model: v.model,
    reference: v.reference || null,
    year: v.year ?? null,
    caseSize: v.caseSize != null ? v.caseSize.toString() : null,
    thickness: v.thickness != null ? v.thickness.toString() : null,
    lugToLug: v.lugToLug != null ? v.lugToLug.toString() : null,
    movementType: v.movementType || null,
    dialColor: v.dialColor || null,
    material: v.material || null,
    waterResistance: v.waterResistance ?? null,
    imageUrls: v.imageUrls ?? [],
  }
}

/** Shape ownership (userWatch) columns, including derived bands. */
function ownershipValues(v: WatchFormValues) {
  return {
    primaryStyle: v.primaryStyle,
    secondaryStyle: v.secondaryStyle ? v.secondaryStyle : null,
    occasionTags: v.occasionTags,
    caseSizeBand: deriveCaseSizeBand(v.caseSize),
    colorFamily: deriveColorFamily(v.dialColor),
    currency: v.currency || "EUR",
    purchasePrice: v.purchasePrice != null ? v.purchasePrice.toString() : null,
    purchaseDate: v.purchaseDate ? new Date(v.purchaseDate) : null,
    marketValueEstimate:
      v.marketValueEstimate != null ? v.marketValueEstimate.toString() : null,
    serialNumber: v.serialNumber || null,
    notes: v.notes || null,
    story: v.story || null,
    isPublic: v.isPublic ?? false,
  }
}

export async function addWatch(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser()

  const parsed = WatchFormSchema.safeParse(rawFromFormData(formData))
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }
  const v = parsed.data

  const [watch] = await db
    .insert(watches)
    .values(watchValues(v))
    .returning({ id: watches.id })

  await db.insert(userWatches).values({
    userId: user.id,
    watchId: watch.id,
    status: "owned",
    ...ownershipValues(v),
  })

  revalidatePath("/collection")
  redirect({ href: "/collection", locale: await getLocale() })
}

/** Wishlist-specific columns from validated form values. */
function wishlistValues(v: WatchFormValues) {
  return {
    targetPrice: v.targetPrice != null ? v.targetPrice.toString() : null,
    timeHorizon: v.timeHorizon ? v.timeHorizon : "mid",
    wishlistStatusLabel: v.wishlistStatusLabel ? v.wishlistStatusLabel : "researching",
    wishlistReason: v.wishlistReason || null,
  }
}

export async function addWishlistItem(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser()

  const parsed = WatchFormSchema.safeParse(rawFromFormData(formData))
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }
  const v = parsed.data

  const [watch] = await db
    .insert(watches)
    .values(watchValues(v))
    .returning({ id: watches.id })

  const wl = wishlistValues(v)
  await db.insert(userWatches).values({
    userId: user.id,
    watchId: watch.id,
    status: wl.timeHorizon === "grail" ? "grail" : "wishlist",
    ...ownershipValues(v),
    isPublic: false,
    ...wl,
  })

  revalidatePath("/wishlist")
  redirect({ href: "/wishlist", locale: await getLocale() })
}

/** Move a wishlist item to another time-horizon column (drag-and-drop). */
export async function updateWishlistHorizon(
  id: string,
  timeHorizon: "short" | "mid" | "long" | "grail"
): Promise<void> {
  const user = await requireUser()
  await db
    .update(userWatches)
    .set({
      timeHorizon,
      status: timeHorizon === "grail" ? "grail" : "wishlist",
      updatedAt: new Date(),
    })
    .where(and(eq(userWatches.id, id), eq(userWatches.userId, user.id)))
  revalidatePath("/wishlist")
}

export async function updateWatch(
  id: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser()

  const existing = await db.query.userWatches.findFirst({
    where: and(eq(userWatches.id, id), eq(userWatches.userId, user.id)),
  })
  if (!existing) return { message: "Watch not found." }

  const parsed = WatchFormSchema.safeParse(rawFromFormData(formData))
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }
  const v = parsed.data

  // Clean up R2 objects for photos removed during the edit.
  const [current] = await db
    .select({ imageUrls: watches.imageUrls })
    .from(watches)
    .where(eq(watches.id, existing.watchId))
    .limit(1)
  const next = new Set(v.imageUrls ?? [])
  const removed = (current?.imageUrls ?? []).filter((u) => !next.has(u))
  if (removed.length > 0) await deleteStoredImages(removed)

  await db
    .update(watches)
    .set(watchValues(v))
    .where(eq(watches.id, existing.watchId))

  await db
    .update(userWatches)
    .set({ ...ownershipValues(v), updatedAt: new Date() })
    .where(eq(userWatches.id, id))

  revalidatePath("/collection")
  revalidatePath(`/collection/${id}`)
  redirect({ href: `/collection/${id}`, locale: await getLocale() })
}

/** Gallery (ADR 0003): move one of the watch's photos to index 0 (primary). */
export async function setPrimaryImage(id: string, url: string): Promise<void> {
  const user = await requireUser()

  const existing = await db.query.userWatches.findFirst({
    where: and(eq(userWatches.id, id), eq(userWatches.userId, user.id)),
    columns: { watchId: true },
  })
  if (!existing) return

  const [w] = await db
    .select({ imageUrls: watches.imageUrls })
    .from(watches)
    .where(eq(watches.id, existing.watchId))
    .limit(1)
  if (!w || !w.imageUrls.includes(url)) return

  await db
    .update(watches)
    .set({ imageUrls: [url, ...w.imageUrls.filter((u) => u !== url)] })
    .where(eq(watches.id, existing.watchId))

  revalidatePath(`/collection/${id}`)
  revalidatePath("/collection")
}

export async function setWatchPublic(id: string, isPublic: boolean): Promise<void> {
  const user = await requireUser()
  await db
    .update(userWatches)
    .set({ isPublic, updatedAt: new Date() })
    .where(and(eq(userWatches.id, id), eq(userWatches.userId, user.id)))
  revalidatePath(`/collection/${id}`)
  revalidatePath("/collection")
}

export async function updateService(
  id: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser()
  const parseDate = (k: string) => {
    const v = formData.get(k)
    if (!v || v === "") return null
    const d = new Date(String(v))
    return Number.isNaN(d.getTime()) ? null : d
  }
  await db
    .update(userWatches)
    .set({
      lastServiceDate: parseDate("lastServiceDate"),
      nextServiceDue: parseDate("nextServiceDue"),
      warrantyExpiresAt: parseDate("warrantyExpiresAt"),
      updatedAt: new Date(),
    })
    .where(and(eq(userWatches.id, id), eq(userWatches.userId, user.id)))
  revalidatePath(`/collection/${id}`)
  revalidatePath("/dashboard")
  return { message: "Service details saved." }
}

export async function deleteWatch(id: string): Promise<void> {
  const user = await requireUser()

  const existing = await db.query.userWatches.findFirst({
    where: and(eq(userWatches.id, id), eq(userWatches.userId, user.id)),
    with: { watch: true },
  })
  if (!existing) {
    redirect({ href: "/collection", locale: await getLocale() })
    return
  }

  await db
    .delete(userWatches)
    .where(and(eq(userWatches.id, id), eq(userWatches.userId, user.id)))

  // Clean up R2-hosted photos — but only if no other collection item still
  // references the same catalog row (watches uses onDelete: restrict).
  const stillReferenced = await db.query.userWatches.findFirst({
    where: eq(userWatches.watchId, existing.watchId),
    columns: { id: true },
  })
  if (!stillReferenced && existing.watch.imageUrls.length > 0) {
    await deleteStoredImages(existing.watch.imageUrls)
  }

  revalidatePath("/collection")
  redirect({ href: "/collection", locale: await getLocale() })
}
