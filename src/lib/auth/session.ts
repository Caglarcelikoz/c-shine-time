import { getServerSession } from "next-auth"
import { getLocale } from "next-intl/server"
import { redirect } from "@/i18n/navigation"
import { authOptions } from "./config"

export async function getSession() {
  return getServerSession(authOptions)
}

/** Returns the current user or redirects to /login. Use in protected pages/actions. */
export async function requireUser() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    redirect({ href: "/login", locale: await getLocale() })
    throw new Error("unreachable")
  }
  return session.user
}
