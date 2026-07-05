import { and, desc, eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { userWatches } from "@/lib/db/schema"
import type { CollectionItem } from "@/lib/types"

/** All of a user's watches (any status), newest first, with catalog data joined. */
export async function getCollection(userId: string): Promise<CollectionItem[]> {
  return db.query.userWatches.findMany({
    where: eq(userWatches.userId, userId),
    with: { watch: true },
    orderBy: [desc(userWatches.createdAt)],
  })
}

/** A single UserWatch by id, scoped to the owner. Returns null if not found/owned. */
export async function getCollectionItem(
  userId: string,
  id: string
): Promise<CollectionItem | null> {
  const item = await db.query.userWatches.findFirst({
    where: and(eq(userWatches.id, id), eq(userWatches.userId, userId)),
    with: { watch: true },
  })
  return item ?? null
}
