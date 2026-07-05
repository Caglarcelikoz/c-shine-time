/**
 * Seeds the shared `watch_catalog` reference table used by the "add a watch"
 * autocomplete (src/components/collection/catalog-search.tsx). This is NOT
 * per-user data — one shared table, safe to re-run (upserts by brand+model).
 *
 * Run with: pnpm exec tsx scripts/seed-catalog.ts
 */
import { readFileSync } from "node:fs"
import { db } from "../src/lib/db"
import { watchCatalog } from "../src/lib/db/schema"

function loadEnv() {
  for (const line of readFileSync(".env.local", "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"\n]*)"?\s*$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2]
  }
}

type Entry = {
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
  primaryStyle:
    | "diver" | "dress" | "field" | "chronograph"
    | "gmt_travel" | "pilot" | "sport_casual"
  occasionTags: ("daily" | "formal" | "travel" | "summer" | "office" | "outdoor")[]
}

const CATALOG: Entry[] = [
  // ── Divers ──────────────────────────────────────────────────────────
  { brand: "Rolex", model: "Submariner Date", reference: "126610LN", year: 2020, caseSize: 41, thickness: 12.5, lugToLug: 48, movementType: "Caliber 3235 Automatic", dialColor: "Black", material: "Steel", waterResistance: 300, primaryStyle: "diver", occasionTags: ["daily", "outdoor"] },
  { brand: "Rolex", model: "Sea-Dweller", reference: "126600", year: 2017, caseSize: 43, thickness: 14, lugToLug: 50, movementType: "Caliber 3235 Automatic", dialColor: "Black", material: "Steel", waterResistance: 1220, primaryStyle: "diver", occasionTags: ["daily", "outdoor"] },
  { brand: "Tudor", model: "Black Bay 58", reference: "79030N", year: 2018, caseSize: 39, thickness: 11.9, lugToLug: 47.5, movementType: "MT5402 Automatic", dialColor: "Black", material: "Steel", waterResistance: 200, primaryStyle: "diver", occasionTags: ["daily", "travel"] },
  { brand: "Tudor", model: "Pelagos", reference: "25600TN", year: 2021, caseSize: 42, thickness: 14.3, lugToLug: 50, movementType: "MT5612 Automatic", dialColor: "Black", material: "Titanium", waterResistance: 500, primaryStyle: "diver", occasionTags: ["outdoor", "daily"] },
  { brand: "Omega", model: "Seamaster Diver 300M", reference: "210.30.42.20.01.001", year: 2018, caseSize: 42, thickness: 13.6, lugToLug: 48, movementType: "Caliber 8800 Automatic", dialColor: "Blue", material: "Steel", waterResistance: 300, primaryStyle: "diver", occasionTags: ["daily", "outdoor"] },
  { brand: "Omega", model: "Planet Ocean 600M", reference: "215.30.44.21.01.001", year: 2019, caseSize: 43.5, thickness: 17.6, lugToLug: 52, movementType: "Caliber 8900 Automatic", dialColor: "Black", material: "Steel", waterResistance: 600, primaryStyle: "diver", occasionTags: ["outdoor", "travel"] },
  { brand: "Seiko", model: "Prospex SPB143 (Willard)", reference: "SPB143J1", year: 2020, caseSize: 40.5, thickness: 12.1, lugToLug: 47, movementType: "6R35 Automatic", dialColor: "Black", material: "Steel", waterResistance: 200, primaryStyle: "diver", occasionTags: ["daily", "outdoor"] },
  { brand: "Seiko", model: "Prospex Turtle SRPE93", reference: "SRPE93K1", year: 2021, caseSize: 45, thickness: 13.2, lugToLug: 48, movementType: "4R36 Automatic", dialColor: "Black", material: "Steel", waterResistance: 200, primaryStyle: "diver", occasionTags: ["daily", "outdoor"] },
  { brand: "Blancpain", model: "Fifty Fathoms", reference: "5015-1130-52", year: 2019, caseSize: 45, thickness: 15.6, lugToLug: 52, movementType: "Caliber 1315 Automatic", dialColor: "Black", material: "Steel", waterResistance: 300, primaryStyle: "diver", occasionTags: ["outdoor", "formal"] },
  { brand: "Doxa", model: "Sub 300 Caribbean", reference: "798.10.201.20", year: 2020, caseSize: 42, thickness: 13, lugToLug: 47, movementType: "ETA 2824-2 Automatic", dialColor: "Turquoise", material: "Steel", waterResistance: 300, primaryStyle: "diver", occasionTags: ["outdoor", "summer"] },

  // ── Dress ───────────────────────────────────────────────────────────
  { brand: "Cartier", model: "Tank Must", reference: "WSTA0053", year: 2021, caseSize: 33.7, thickness: 6.6, lugToLug: 42, movementType: "Quartz", dialColor: "Silver", material: "Steel", waterResistance: 30, primaryStyle: "dress", occasionTags: ["formal", "office"] },
  { brand: "Cartier", model: "Santos-Dumont", reference: "WSSA0023", year: 2020, caseSize: 31.4, thickness: 6.6, lugToLug: 43.5, movementType: "Manual", dialColor: "Silver", material: "Steel", waterResistance: 30, primaryStyle: "dress", occasionTags: ["formal"] },
  { brand: "Patek Philippe", model: "Calatrava", reference: "6119G-001", year: 2024, caseSize: 39, thickness: 8.1, lugToLug: 44, movementType: "Caliber 30-255 Manual", dialColor: "Silver", material: "White gold", waterResistance: 30, primaryStyle: "dress", occasionTags: ["formal"] },
  { brand: "Jaeger-LeCoultre", model: "Master Ultra Thin", reference: "Q1338421", year: 2019, caseSize: 39, thickness: 8.9, lugToLug: 46, movementType: "Caliber 899 Automatic", dialColor: "Silver", material: "Steel", waterResistance: 50, primaryStyle: "dress", occasionTags: ["formal", "office"] },
  { brand: "Vacheron Constantin", model: "Patrimony", reference: "85180/000G-9230", year: 2018, caseSize: 40, thickness: 8.1, lugToLug: 47, movementType: "Caliber 2450 Automatic", dialColor: "Silver", material: "White gold", waterResistance: 30, primaryStyle: "dress", occasionTags: ["formal"] },
  { brand: "Nomos Glashütte", model: "Tangente 38", reference: "139", year: 2020, caseSize: 38, thickness: 6.5, lugToLug: 46, movementType: "Caliber Alpha Manual", dialColor: "White", material: "Steel", waterResistance: 30, primaryStyle: "dress", occasionTags: ["formal", "office"] },
  { brand: "Longines", model: "Elegant Collection", reference: "L4.910.4.11.6", year: 2019, caseSize: 37, thickness: 8.4, lugToLug: 44, movementType: "L619 Automatic", dialColor: "Silver", material: "Steel", waterResistance: 30, primaryStyle: "dress", occasionTags: ["formal", "office"] },
  { brand: "Grand Seiko", model: "Elegance SBGW231", reference: "SBGW231", year: 2020, caseSize: 37.3, thickness: 11.3, lugToLug: 44, movementType: "Caliber 9S64 Manual", dialColor: "White", material: "Steel", waterResistance: 30, primaryStyle: "dress", occasionTags: ["formal"] },

  // ── Field ───────────────────────────────────────────────────────────
  { brand: "Rolex", model: "Explorer", reference: "224270", year: 2021, caseSize: 36, thickness: 12.1, lugToLug: 44, movementType: "Caliber 3230 Automatic", dialColor: "Black", material: "Steel", waterResistance: 100, primaryStyle: "field", occasionTags: ["daily", "outdoor"] },
  { brand: "IWC", model: "Ingenieur Automatic", reference: "IW328903", year: 2017, caseSize: 40, thickness: 11.5, lugToLug: 47, movementType: "Caliber 30110 Automatic", dialColor: "Silver", material: "Steel", waterResistance: 120, primaryStyle: "field", occasionTags: ["daily", "office"] },
  { brand: "Seiko", model: "Alpinist SPB121", reference: "SPB121J1", year: 2020, caseSize: 39.5, thickness: 13, lugToLug: 47.3, movementType: "6R35 Automatic", dialColor: "Green", material: "Steel", waterResistance: 200, primaryStyle: "field", occasionTags: ["outdoor", "daily"] },
  { brand: "Hamilton", model: "Khaki Field Mechanical", reference: "H69439931", year: 2019, caseSize: 38, thickness: 9.7, lugToLug: 45, movementType: "H-50 Manual", dialColor: "Black", material: "Steel", waterResistance: 100, primaryStyle: "field", occasionTags: ["outdoor", "daily"] },
  { brand: "Tudor", model: "Ranger", reference: "79950", year: 2022, caseSize: 39, thickness: 11.7, lugToLug: 46, movementType: "MT5402 Automatic", dialColor: "Black", material: "Steel", waterResistance: 100, primaryStyle: "field", occasionTags: ["outdoor", "daily"] },
  { brand: "Marathon", model: "General Purpose Mechanical", reference: "WW194003", year: 2020, caseSize: 34, thickness: 10, lugToLug: 42, movementType: "ETA 2801-2 Manual", dialColor: "Black", material: "Steel", waterResistance: 100, primaryStyle: "field", occasionTags: ["outdoor"] },

  // ── Chronograph ─────────────────────────────────────────────────────
  { brand: "Omega", model: "Speedmaster Professional Moonwatch", reference: "310.30.42.50.01.001", year: 2021, caseSize: 42, thickness: 13.2, lugToLug: 48, movementType: "Caliber 3861 Manual", dialColor: "Black", material: "Steel", waterResistance: 50, primaryStyle: "chronograph", occasionTags: ["daily", "office"] },
  { brand: "Rolex", model: "Daytona", reference: "126500LN", year: 2023, caseSize: 40, thickness: 12.4, lugToLug: 48, movementType: "Caliber 4131 Automatic", dialColor: "White", material: "Steel", waterResistance: 100, primaryStyle: "chronograph", occasionTags: ["formal", "office"] },
  { brand: "Tudor", model: "Black Bay Chrono", reference: "79360N", year: 2020, caseSize: 41, thickness: 14.6, lugToLug: 48, movementType: "MT5813 Automatic", dialColor: "Black", material: "Steel", waterResistance: 200, primaryStyle: "chronograph", occasionTags: ["daily", "travel"] },
  { brand: "Zenith", model: "Chronomaster Sport", reference: "03.3100.3600/69.M3100", year: 2021, caseSize: 41, thickness: 13.6, lugToLug: 48, movementType: "El Primero 3600 Automatic", dialColor: "Black", material: "Steel", waterResistance: 100, primaryStyle: "chronograph", occasionTags: ["daily", "office"] },
  { brand: "TAG Heuer", model: "Carrera Chronograph", reference: "CBK2110.FC6506", year: 2022, caseSize: 42, thickness: 14.1, lugToLug: 48, movementType: "Caliber Heuer 02 Automatic", dialColor: "Black", material: "Steel", waterResistance: 100, primaryStyle: "chronograph", occasionTags: ["daily", "office"] },
  { brand: "Breitling", model: "Navitimer B01", reference: "AB0138211B1A1", year: 2020, caseSize: 41, thickness: 13.9, lugToLug: 49, movementType: "Caliber B01 Automatic", dialColor: "Black", material: "Steel", waterResistance: 30, primaryStyle: "chronograph", occasionTags: ["travel", "office"] },

  // ── GMT / Travel ────────────────────────────────────────────────────
  { brand: "Rolex", model: "GMT-Master II Batman", reference: "126710BLNR", year: 2019, caseSize: 40, thickness: 12.4, lugToLug: 48, movementType: "Caliber 3285 Automatic", dialColor: "Black", material: "Steel", waterResistance: 100, primaryStyle: "gmt_travel", occasionTags: ["travel", "daily"] },
  { brand: "Longines", model: "Spirit Zulu Time 39", reference: "L3.812.4.53.6", year: 2022, caseSize: 39, thickness: 12.1, lugToLug: 46, movementType: "L844.4 Automatic", dialColor: "Black", material: "Steel", waterResistance: 100, primaryStyle: "gmt_travel", occasionTags: ["travel", "daily"] },
  { brand: "Grand Seiko", model: "Sport GMT SBGJ255", reference: "SBGJ255", year: 2021, caseSize: 40.2, thickness: 12.6, lugToLug: 47, movementType: "Caliber 9S86 Automatic", dialColor: "Blue", material: "Steel", waterResistance: 200, primaryStyle: "gmt_travel", occasionTags: ["travel", "daily"] },
  { brand: "Tudor", model: "Black Bay GMT", reference: "79830RB", year: 2022, caseSize: 41, thickness: 14.8, lugToLug: 47.8, movementType: "MT5652 Automatic", dialColor: "Black", material: "Steel", waterResistance: 200, primaryStyle: "gmt_travel", occasionTags: ["travel", "daily"] },
  { brand: "Seiko", model: "Prospex Alpinist GMT", reference: "SPB379", year: 2022, caseSize: 39.5, thickness: 13.2, lugToLug: 46.7, movementType: "6R54 Automatic", dialColor: "Green", material: "Steel", waterResistance: 200, primaryStyle: "gmt_travel", occasionTags: ["travel", "outdoor"] },

  // ── Pilot ───────────────────────────────────────────────────────────
  { brand: "IWC", model: "Pilot's Watch Mark XVIII", reference: "IW327001", year: 2018, caseSize: 40, thickness: 10.8, lugToLug: 47, movementType: "Caliber 30110 Automatic", dialColor: "Black", material: "Steel", waterResistance: 60, primaryStyle: "pilot", occasionTags: ["daily", "travel"] },
  { brand: "IWC", model: "Big Pilot's Watch", reference: "IW329301", year: 2020, caseSize: 46.2, thickness: 15.8, lugToLug: 53, movementType: "Caliber 52110 Automatic", dialColor: "Black", material: "Steel", waterResistance: 60, primaryStyle: "pilot", occasionTags: ["travel", "outdoor"] },
  { brand: "Breitling", model: "Aviator 8", reference: "AB0119131B1X1", year: 2021, caseSize: 41, thickness: 13.1, lugToLug: 48, movementType: "Caliber 17 Automatic", dialColor: "Black", material: "Steel", waterResistance: 100, primaryStyle: "pilot", occasionTags: ["travel", "daily"] },
  { brand: "Zenith", model: "Pilot Type 20", reference: "11.2430.679/21.C773", year: 2019, caseSize: 40, thickness: 12.4, lugToLug: 48, movementType: "Elite 679 Automatic", dialColor: "Black", material: "Bronze", waterResistance: 100, primaryStyle: "pilot", occasionTags: ["travel", "outdoor"] },
  { brand: "Bell & Ross", model: "BR 03-92", reference: "BR0392-BL-ST/SCA", year: 2020, caseSize: 42, thickness: 10.8, lugToLug: 42, movementType: "ETA 2892-A2 Automatic", dialColor: "Black", material: "Steel", waterResistance: 100, primaryStyle: "pilot", occasionTags: ["daily", "office"] },

  // ── Sport / Casual ──────────────────────────────────────────────────
  { brand: "Rolex", model: "Datejust 41", reference: "126334", year: 2022, caseSize: 41, thickness: 11.8, lugToLug: 48, movementType: "Caliber 3235 Automatic", dialColor: "Blue", material: "Steel", waterResistance: 100, primaryStyle: "sport_casual", occasionTags: ["daily", "office"] },
  { brand: "Omega", model: "Aqua Terra 150M", reference: "220.10.41.21.03.001", year: 2021, caseSize: 41, thickness: 11.8, lugToLug: 47, movementType: "Caliber 8900 Automatic", dialColor: "Blue", material: "Steel", waterResistance: 150, primaryStyle: "sport_casual", occasionTags: ["daily", "office"] },
  { brand: "Audemars Piguet", model: "Royal Oak", reference: "15500ST.OO.1220ST.01", year: 2020, caseSize: 41, thickness: 10.4, lugToLug: 49, movementType: "Caliber 4302 Automatic", dialColor: "Blue", material: "Steel", waterResistance: 50, primaryStyle: "sport_casual", occasionTags: ["daily", "formal"] },
  { brand: "Patek Philippe", model: "Nautilus", reference: "5711/1A-014", year: 2021, caseSize: 40, thickness: 8.3, lugToLug: 48.5, movementType: "Caliber 26-330 Automatic", dialColor: "Green", material: "Steel", waterResistance: 120, primaryStyle: "sport_casual", occasionTags: ["daily", "formal"] },
  { brand: "Grand Seiko", model: "Spring Drive SBGA211 (Snowflake)", reference: "SBGA211", year: 2019, caseSize: 41, thickness: 12.5, lugToLug: 47.7, movementType: "Caliber 9R65 Spring Drive", dialColor: "White", material: "Titanium", waterResistance: 100, primaryStyle: "sport_casual", occasionTags: ["daily", "office"] },
  { brand: "Vacheron Constantin", model: "Overseas", reference: "4500V/110A-B128", year: 2020, caseSize: 41, thickness: 11, lugToLug: 48, movementType: "Caliber 5100 Automatic", dialColor: "Blue", material: "Steel", waterResistance: 150, primaryStyle: "sport_casual", occasionTags: ["daily", "travel"] },
  { brand: "Nomos Glashütte", model: "Club Sport Neomatik", reference: "745", year: 2021, caseSize: 39, thickness: 9.9, lugToLug: 46, movementType: "Caliber DUW 6101 Automatic", dialColor: "Black", material: "Steel", waterResistance: 200, primaryStyle: "sport_casual", occasionTags: ["daily", "outdoor"] },
  { brand: "Seiko", model: "Presage Cocktail Time", reference: "SRPB43", year: 2019, caseSize: 40.5, thickness: 11.8, lugToLug: 46, movementType: "4R35 Automatic", dialColor: "Blue", material: "Steel", waterResistance: 50, primaryStyle: "sport_casual", occasionTags: ["daily", "office"] },
]

async function main() {
  loadEnv()
  let inserted = 0
  let skipped = 0
  for (const e of CATALOG) {
    const existing = await db.query.watchCatalog.findFirst({
      where: (t, { and, eq }) => and(eq(t.brand, e.brand), eq(t.model, e.model)),
    })
    if (existing) {
      skipped++
      continue
    }
    await db.insert(watchCatalog).values({
      brand: e.brand,
      model: e.model,
      reference: e.reference ?? null,
      year: e.year ?? null,
      caseSize: e.caseSize.toString(),
      thickness: e.thickness != null ? e.thickness.toString() : null,
      lugToLug: e.lugToLug != null ? e.lugToLug.toString() : null,
      movementType: e.movementType,
      dialColor: e.dialColor,
      material: e.material,
      waterResistance: e.waterResistance ?? null,
      primaryStyle: e.primaryStyle,
      occasionTags: e.occasionTags,
    })
    inserted++
  }
  console.log(`watch_catalog seed: ${inserted} inserted, ${skipped} already present.`)
}

main()
