import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { advisorRuns, users } from "@/lib/db/schema"

export interface OnboardingState {
  dismissed: boolean
  hasAdvisorRun: boolean
}

/**
 * ADR 0004 — checklist steps are DERIVED from real data (owned count comes
 * from the page's existing collection query); only dismissal is stored.
 */
export async function getOnboardingState(userId: string): Promise<OnboardingState> {
  const [[row], [run]] = await Promise.all([
    db
      .select({ dismissedAt: users.onboardingDismissedAt })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1),
    db
      .select({ id: advisorRuns.id })
      .from(advisorRuns)
      .where(eq(advisorRuns.userId, userId))
      .limit(1),
  ])
  return { dismissed: row?.dismissedAt != null, hasAdvisorRun: Boolean(run) }
}
