"use server"

import { revalidatePath } from "next/cache"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { requireUser } from "@/lib/auth/session"

/** ADR 0004 — hide the setup checklist for good (sticks across devices). */
export async function dismissOnboarding(): Promise<void> {
  const user = await requireUser()
  await db
    .update(users)
    .set({ onboardingDismissedAt: new Date(), updatedAt: new Date() })
    .where(eq(users.id, user.id))
  revalidatePath("/dashboard")
}
