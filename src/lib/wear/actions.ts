"use server"

import { revalidatePath } from "next/cache"
import { and, desc, eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { userWatches, wearLogs } from "@/lib/db/schema"
import { requireUser } from "@/lib/auth/session"

/** Today's date as YYYY-MM-DD in the server's local time. */
function todayStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

async function assertOwnership(userWatchId: string, userId: string) {
  const [row] = await db
    .select({ id: userWatches.id })
    .from(userWatches)
    .where(and(eq(userWatches.id, userWatchId), eq(userWatches.userId, userId)))
    .limit(1)
  return Boolean(row)
}

/** Toggle "worn" for a given calendar day — idempotent (at most one row per day). */
export async function toggleWornOn(userWatchId: string, date: string): Promise<void> {
  const user = await requireUser()
  if (!(await assertOwnership(userWatchId, user.id))) return
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date > todayStr()) return // no future dates

  const [existing] = await db
    .select({ id: wearLogs.id })
    .from(wearLogs)
    .where(and(eq(wearLogs.userWatchId, userWatchId), eq(wearLogs.wornOn, date)))
    .limit(1)

  if (existing) {
    await db.delete(wearLogs).where(eq(wearLogs.id, existing.id))
  } else {
    await db.insert(wearLogs).values({ userWatchId, wornOn: date })
  }

  revalidatePath(`/collection/${userWatchId}`)
  revalidatePath("/dashboard")
}

/** Convenience wrapper — toggles today specifically. */
export async function toggleWornToday(userWatchId: string): Promise<void> {
  return toggleWornOn(userWatchId, todayStr())
}

export interface WearSummary {
  totalWears: number
  wornToday: boolean
  lastWornOn: string | null
  /** Last 14 calendar days, oldest first, each true if worn that day. */
  recentDays: { date: string; worn: boolean }[]
}

export async function getWearSummary(userWatchId: string, userId: string): Promise<WearSummary> {
  const logs = await db
    .select({ wornOn: wearLogs.wornOn })
    .from(wearLogs)
    .innerJoin(userWatches, eq(wearLogs.userWatchId, userWatches.id))
    .where(and(eq(wearLogs.userWatchId, userWatchId), eq(userWatches.userId, userId)))
    .orderBy(desc(wearLogs.wornOn))

  const wornSet = new Set(logs.map((l) => l.wornOn))
  const today = todayStr()

  const recentDays: { date: string; worn: boolean }[] = []
  for (let i = 13; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
    recentDays.push({ date: key, worn: wornSet.has(key) })
  }

  return {
    totalWears: logs.length,
    wornToday: wornSet.has(today),
    lastWornOn: logs[0]?.wornOn ?? null,
    recentDays,
  }
}
