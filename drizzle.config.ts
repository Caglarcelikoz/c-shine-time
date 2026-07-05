import { readFileSync } from "node:fs"
import { defineConfig } from "drizzle-kit"

// drizzle-kit doesn't auto-load .env.local (that's a Next.js convention),
// so load it here before reading DATABASE_URL.
function loadEnvLocal() {
  if (process.env.DATABASE_URL) return
  try {
    const file = readFileSync(".env.local", "utf8")
    for (const line of file.split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"\n]*)"?\s*$/)
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2]
    }
  } catch {
    // no .env.local — rely on the ambient environment
  }
}

loadEnvLocal()

export default defineConfig({
  schema: "./src/lib/db/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
})
