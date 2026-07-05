import { neon } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"
import * as schema from "./schema"

type DrizzleDb = ReturnType<typeof drizzle<typeof schema>>

let _instance: DrizzleDb | undefined

function getInstance(): DrizzleDb {
  if (!_instance) {
    _instance = drizzle(neon(process.env.DATABASE_URL!), { schema })
  }
  return _instance
}

// Lazy proxy — connection opens on first query, not at module load
export const db: DrizzleDb = new Proxy({} as DrizzleDb, {
  get(_target, prop, receiver) {
    return Reflect.get(getInstance(), prop, receiver)
  },
})
