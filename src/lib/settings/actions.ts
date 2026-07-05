"use server"

import { revalidatePath } from "next/cache"
import { and, eq, ne } from "drizzle-orm"
import { z } from "zod"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { requireUser } from "@/lib/auth/session"
import type { ActionState } from "@/lib/definitions"
import { PROFILE_THEMES, type ProfileTheme } from "@/lib/profile/themes"

const UsernameSchema = z
  .string()
  .min(3, { error: "Username must be at least 3 characters." })
  .max(30, { error: "Username must be 30 characters or fewer." })
  .regex(/^[a-z0-9_-]+$/, {
    error: "Only lowercase letters, numbers, hyphens, and underscores.",
  })
  .trim()

export async function updateUsername(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser()

  const parsed = UsernameSchema.safeParse(formData.get("username"))
  if (!parsed.success) {
    return { errors: { username: parsed.error.issues.map((i) => i.message) } }
  }
  const username = parsed.data

  const [taken] = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.username, username), ne(users.id, user.id)))
    .limit(1)
  if (taken) return { errors: { username: ["This username is already taken."] } }

  await db.update(users).set({ username, updatedAt: new Date() }).where(eq(users.id, user.id))
  revalidatePath("/settings")
  return { message: "Username saved." }
}

type ToggleKey =
  | "publicProfileEnabled"
  | "hideCollectionValue"
  | "hidePurchasePrices"
  | "hideWishlist"
  | "hideSoldArchive"

const VALID_TOGGLES: ToggleKey[] = [
  "publicProfileEnabled",
  "hideCollectionValue",
  "hidePurchasePrices",
  "hideWishlist",
  "hideSoldArchive",
]

export async function updatePrivacyToggle(key: ToggleKey, value: boolean): Promise<void> {
  const user = await requireUser()
  if (!VALID_TOGGLES.includes(key)) return
  await db
    .update(users)
    .set({ [key]: value, updatedAt: new Date() })
    .where(eq(users.id, user.id))
  revalidatePath("/settings")
}

export async function updateProfileTheme(theme: ProfileTheme): Promise<void> {
  const user = await requireUser()
  if (!(PROFILE_THEMES as readonly string[]).includes(theme)) return
  await db
    .update(users)
    .set({ profileTheme: theme, updatedAt: new Date() })
    .where(eq(users.id, user.id))
  revalidatePath("/settings")
  revalidatePath(`/${user.username}`)
}
