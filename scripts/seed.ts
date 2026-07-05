/**
 * Seed script — adds a deliberately uneven collection (requirements §7):
 *  - 3 overlapping black 38–42mm divers  → overlap detection fires
 *  - dress / chronograph / pilot missing → gap analysis has something to report
 *  - formal / summer occasions uncovered → occasion gaps
 *  - a wishlist that fills exactly those gaps (dress + chronograph)
 *
 * Run with:  pnpm db:seed         (targets the first / only registered user)
 * Idempotent: skips watches you already have (matched by brand + model).
 */
import { readFileSync } from "node:fs"
import { eq } from "drizzle-orm"
import { db } from "../src/lib/db"
import { users, watches, userWatches } from "../src/lib/db/schema"
import { deriveCaseSizeBand, deriveColorFamily } from "../src/lib/collection/derive"

// Load .env.local before the lazy db proxy reads DATABASE_URL (the import above
// is a lazy proxy, so the connection only opens on the first query in main()).
function loadEnv() {
  for (const line of readFileSync(".env.local", "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"\n]*)"?\s*$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2]
  }
}

type Seed = {
  brand: string
  model: string
  reference?: string
  year?: number
  caseSize: number
  thickness?: number
  lugToLug?: number
  movementType: string
  dialColor: string
  material: string
  waterResistance?: number
  imageUrl?: string
  status: "owned" | "wishlist" | "grail"
  primaryStyle:
    | "diver" | "dress" | "field" | "chronograph"
    | "gmt_travel" | "pilot" | "sport_casual"
  occasionTags: ("daily" | "formal" | "travel" | "summer" | "office" | "outdoor")[]
  price: number
  timeHorizon?: "short" | "mid" | "long" | "grail"
  wishlistReason?: string
  wishlistStatusLabel?:
    | "researching" | "waiting_for_price_drop" | "ready_to_buy" | "dreaming"
}

const SEEDS: Seed[] = [
  // ── Owned — 3 black divers in the 38–42 band that overlap each other ──
  {
    brand: "Seiko", model: "Prospex SPB143", reference: "SPB143J1", year: 2020,
    caseSize: 40.5, thickness: 12.1, lugToLug: 47, movementType: "6R35 Automatic",
    dialColor: "Black", material: "Steel", waterResistance: 200,
    status: "owned", primaryStyle: "diver", occasionTags: ["daily", "outdoor"], price: 1100,
  },
  {
    brand: "Tudor", model: "Black Bay Fifty-Eight", reference: "79030N", year: 2018,
    caseSize: 39, thickness: 11.9, lugToLug: 47.5, movementType: "MT5402 Automatic",
    dialColor: "Black", material: "Steel", waterResistance: 200,
    status: "owned", primaryStyle: "diver", occasionTags: ["daily", "travel"], price: 3500,
  },
  {
    brand: "Oris", model: "Divers Sixty-Five", reference: "01 733 7707", year: 2019,
    caseSize: 40, thickness: 13, lugToLug: 48, movementType: "Oris 733 Automatic",
    dialColor: "Black", material: "Steel", waterResistance: 100,
    status: "owned", primaryStyle: "diver", occasionTags: ["daily", "outdoor"], price: 1900,
  },
  // ── Owned — variety so styles aren't all divers ──
  {
    brand: "Seiko", model: "Alpinist SARB017", reference: "SARB017", year: 2015,
    caseSize: 38, thickness: 12, lugToLug: 46, movementType: "6R15 Automatic",
    dialColor: "Green", material: "Steel", waterResistance: 200,
    status: "owned", primaryStyle: "field", occasionTags: ["outdoor", "travel"], price: 700,
  },
  {
    brand: "Omega", model: "Aqua Terra 150M", reference: "220.10.38", year: 2021,
    caseSize: 38, thickness: 12.2, lugToLug: 44, movementType: "Co-Axial 8800 Automatic",
    dialColor: "Blue", material: "Steel", waterResistance: 150,
    status: "owned", primaryStyle: "sport_casual", occasionTags: ["office", "daily"], price: 5200,
  },
  {
    brand: "Longines", model: "Spirit Zulu Time 39", reference: "L3.802.4", year: 2023,
    caseSize: 39, thickness: 13.7, lugToLug: 47, movementType: "L844.4 Automatic",
    dialColor: "Black", material: "Steel", waterResistance: 100,
    status: "owned", primaryStyle: "gmt_travel", occasionTags: ["travel", "office"], price: 3200,
  },

  // ── Wishlist — fills the dress + chronograph gaps ──
  {
    brand: "Cartier", model: "Tank Must Small", reference: "WSTA0041", year: 2023,
    caseSize: 31, thickness: 6.6, lugToLug: 34, movementType: "Quartz",
    dialColor: "Silver", material: "Steel", waterResistance: 30,
    status: "wishlist", primaryStyle: "dress", occasionTags: ["formal", "office"], price: 3050,
    timeHorizon: "short", wishlistStatusLabel: "ready_to_buy",
    wishlistReason: "Adds dress geometry and a light dial the collection lacks.",
  },
  {
    brand: "Zenith", model: "Chronomaster Original", reference: "03.3200", year: 2022,
    caseSize: 38, thickness: 12.6, lugToLug: 47, movementType: "El Primero Automatic",
    dialColor: "Silver", material: "Steel", waterResistance: 50,
    status: "wishlist", primaryStyle: "chronograph", occasionTags: ["office", "daily"], price: 9500,
    timeHorizon: "mid", wishlistStatusLabel: "researching",
    wishlistReason: "A chronograph with real movement pedigree.",
  },
  {
    brand: "Grand Seiko", model: "Elegance SBGW231", reference: "SBGW231", year: 2021,
    caseSize: 37.3, thickness: 11.6, lugToLug: 44, movementType: "9S64 Manual",
    dialColor: "White", material: "Steel", waterResistance: 30,
    status: "wishlist", primaryStyle: "dress", occasionTags: ["formal"], price: 4300,
    timeHorizon: "long", wishlistStatusLabel: "researching",
    wishlistReason: "The understated dress piece I'm missing.",
  },
  {
    brand: "Patek Philippe", model: "Calatrava 6119G", reference: "6119G-001", year: 2024,
    caseSize: 39, thickness: 8.1, lugToLug: 44, movementType: "Caliber 30-255 Manual",
    dialColor: "Silver", material: "White gold", waterResistance: 30,
    status: "grail", primaryStyle: "dress", occasionTags: ["formal"], price: 32400,
    timeHorizon: "grail", wishlistStatusLabel: "dreaming",
    wishlistReason: "The endgame dress watch.",
  },
]

async function main() {
  loadEnv()
  const [user] = await db.select().from(users).limit(1)
  if (!user) {
    console.error("No registered user found. Register an account first, then re-run.")
    process.exit(1)
  }
  console.log(`Seeding for user: ${user.name} (@${user.username})`)

  const existing = await db.query.userWatches.findMany({
    where: eq(userWatches.userId, user.id),
    with: { watch: true },
  })
  const have = new Set(existing.map((e) => `${e.watch.brand}|${e.watch.model}`))

  let added = 0
  for (const s of SEEDS) {
    if (have.has(`${s.brand}|${s.model}`)) {
      console.log(`  skip (exists): ${s.brand} ${s.model}`)
      continue
    }
    const [watch] = await db
      .insert(watches)
      .values({
        brand: s.brand,
        model: s.model,
        reference: s.reference ?? null,
        year: s.year ?? null,
        caseSize: s.caseSize.toString(),
        thickness: s.thickness?.toString() ?? null,
        lugToLug: s.lugToLug?.toString() ?? null,
        movementType: s.movementType,
        dialColor: s.dialColor,
        material: s.material,
        waterResistance: s.waterResistance ?? null,
        imageUrls: s.imageUrl ? [s.imageUrl] : [],
      })
      .returning({ id: watches.id })

    const isWishlist = s.status === "wishlist" || s.status === "grail"
    await db.insert(userWatches).values({
      userId: user.id,
      watchId: watch.id,
      status: s.status,
      primaryStyle: s.primaryStyle,
      occasionTags: s.occasionTags,
      caseSizeBand: deriveCaseSizeBand(s.caseSize),
      colorFamily: deriveColorFamily(s.dialColor),
      currency: "EUR",
      purchasePrice: isWishlist ? null : s.price.toString(),
      marketValueEstimate: s.price.toString(),
      targetPrice: isWishlist ? s.price.toString() : null,
      timeHorizon: s.timeHorizon ?? null,
      wishlistReason: s.wishlistReason ?? null,
      wishlistStatusLabel: s.wishlistStatusLabel ?? null,
      isPublic: !isWishlist,
    })
    added++
    console.log(`  added: ${s.brand} ${s.model} (${s.status})`)
  }

  console.log(`\nDone — ${added} watch(es) added.`)
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
