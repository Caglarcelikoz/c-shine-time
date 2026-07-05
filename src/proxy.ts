import { getToken } from "next-auth/jwt"
import createMiddleware from "next-intl/middleware"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { routing } from "@/i18n/routing"

const protectedRoutes = [
  "/dashboard",
  "/collection",
  "/wishlist",
  "/advisor",
  "/compare",
  "/profile",
  "/settings",
]

const handleI18nRouting = createMiddleware(routing)

/** Pathname with a known locale prefix (e.g. "/en") stripped, or as-is if none. */
function stripLocale(pathname: string): string {
  for (const locale of routing.locales) {
    if (pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)) {
      return pathname.slice(locale.length + 1) || "/"
    }
  }
  return pathname
}

export async function proxy(request: NextRequest) {
  // Step 1: next-intl resolves/redirects/rewrites for the locale prefix.
  const response = handleI18nRouting(request)

  // Step 2: auth gate, checked against the locale-stripped pathname.
  const pathname = stripLocale(request.nextUrl.pathname)
  const isProtected = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  )
  if (!isProtected) return response

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  })
  if (!token) {
    const locale = routing.locales.find(
      (l) => request.nextUrl.pathname === `/${l}` || request.nextUrl.pathname.startsWith(`/${l}/`)
    ) ?? routing.defaultLocale
    const loginUrl = new URL(`/${locale}/login`, request.url)
    loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  return response
}

export const config = {
  matcher: [
    // Skip _next internals, the NextAuth API, and any public/ static file
    // (anything with a dot, e.g. hero-watch-box.jpg, favicon.ico) — otherwise
    // next-intl's locale redirect intercepts static assets and breaks them.
    "/((?!_next/static|_next/image|api/auth|.*\\..*).*)",
  ],
}
