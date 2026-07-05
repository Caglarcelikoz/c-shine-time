import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { userWatches, users } from "@/lib/db/schema"
import { computeTagScores, toRuleWatch } from "@/lib/rule-engine"
import { formatMoney } from "@/lib/currency"
import type { CollectionItem, OccasionTag, PrimaryStyle, TimeHorizon } from "@/lib/types"
import type { TagScore } from "@/lib/rule-engine"

/** A deliberately safe, public-only projection of a watch — no price/serial/notes. */
export interface PublicWatch {
  id: string
  brand: string
  model: string
  reference: string | null
  year: number | null
  caseSize: string | null
  thickness: string | null
  lugToLug: string | null
  movementType: string | null
  dialColor: string | null
  material: string | null
  waterResistance: number | null
  imageUrl: string | null
  primaryStyle: PrimaryStyle
  occasionTags: OccasionTag[]
  story: string | null
}

export interface PublicWishlistItem {
  id: string
  brand: string
  model: string
  imageUrl: string | null
  timeHorizon: TimeHorizon | null
}

export interface PublicProfile {
  name: string
  username: string
  bio: string | null
  avatar: string | null
  isPublic: boolean
  profileTheme: string
  tagScores: TagScore[]
  stats: { owned: number; wishlist: number; sold: number }
  totalValue: string | null
  featured: PublicWatch | null
  watches: PublicWatch[]
  wishlist: PublicWishlistItem[]
}

function toPublicWatch(item: CollectionItem): PublicWatch {
  const w = item.watch
  return {
    id: item.id,
    brand: w.brand,
    model: w.model,
    reference: w.reference,
    year: w.year,
    caseSize: w.caseSize,
    thickness: w.thickness,
    lugToLug: w.lugToLug,
    movementType: w.movementType,
    dialColor: w.dialColor,
    material: w.material,
    waterResistance: w.waterResistance,
    imageUrl: w.imageUrls?.[0] ?? null,
    primaryStyle: item.primaryStyle,
    occasionTags: item.occasionTags,
    story: item.story,
    // NOTE: purchasePrice, marketValueEstimate, serialNumber, notes, purchaseDate
    // are intentionally NOT projected — they can never reach the client.
  }
}

export async function getPublicProfile(rawUsername: string): Promise<PublicProfile | null> {
  const username = rawUsername.replace(/^@/, "").toLowerCase()
  const [user] = await db.select().from(users).where(eq(users.username, username)).limit(1)
  if (!user) return null

  // Not public → return a stub the page renders as "private", but leak nothing else.
  if (!user.publicProfileEnabled) {
    return {
      name: user.name,
      username: user.username,
      bio: null,
      avatar: null,
      isPublic: false,
      profileTheme: user.profileTheme,
      tagScores: [],
      stats: { owned: 0, wishlist: 0, sold: 0 },
      totalValue: null,
      featured: null,
      watches: [],
      wishlist: [],
    }
  }

  const all = await db.query.userWatches.findMany({
    where: eq(userWatches.userId, user.id),
    with: { watch: true },
  })

  const publicOwned = all.filter((i) => i.status === "owned" && i.isPublic)
  const soldPublic = user.hideSoldArchive
    ? []
    : all.filter((i) => i.status === "sold" && i.isPublic)
  const wishlist = user.hideWishlist
    ? []
    : all.filter((i) => i.status === "wishlist" || i.status === "grail")

  // Total value (market estimate) — only if not hidden. Summed per dominant currency.
  let totalValue: string | null = null
  if (!user.hideCollectionValue) {
    const totals = new Map<string, number>()
    for (const i of publicOwned) {
      const v = Number(i.marketValueEstimate ?? 0)
      if (v > 0) totals.set(i.currency || "EUR", (totals.get(i.currency || "EUR") ?? 0) + v)
    }
    const top = [...totals.entries()].sort((a, b) => b[1] - a[1])[0]
    if (top) totalValue = formatMoney(top[1], top[0])
  }

  const tagScores = computeTagScores(publicOwned.map(toRuleWatch))

  return {
    name: user.name,
    username: user.username,
    bio: user.bio,
    avatar: user.avatar,
    isPublic: true,
    profileTheme: user.profileTheme,
    tagScores,
    stats: {
      owned: publicOwned.length,
      wishlist: wishlist.length,
      sold: soldPublic.length,
    },
    totalValue,
    featured: publicOwned[0] ? toPublicWatch(publicOwned[0]) : null,
    watches: publicOwned.map(toPublicWatch),
    wishlist: wishlist.map((i) => ({
      id: i.id,
      brand: i.watch.brand,
      model: i.watch.model,
      imageUrl: i.watch.imageUrls?.[0] ?? null,
      timeHorizon: (i.timeHorizon as TimeHorizon | null) ?? null,
    })),
  }
}
