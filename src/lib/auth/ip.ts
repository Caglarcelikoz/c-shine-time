import "server-only"

/**
 * Best-effort client IP for rate-limit keys.
 *
 * SECURITY NOTE: `x-forwarded-for` is client-controllable unless a trusted proxy
 * overwrites it. On Vercel the platform sets a spoof-proof `x-real-ip` (and the
 * leftmost `x-forwarded-for` entry), so we prefer `x-real-ip` first. If this app is
 * ever deployed behind a different proxy, ensure that proxy strips inbound
 * forwarded headers — otherwise IP-keyed limits can be bypassed by spoofing. IP is
 * only ever ONE of the limiter keys (email is the other), so a spoofed IP still
 * can't bypass per-email throttling.
 */
export function clientIpFromHeaders(
  headers: Headers | Record<string, string | string[] | undefined> | undefined
): string {
  if (!headers) return "unknown"

  const get = (name: string): string | undefined => {
    if (headers instanceof Headers) return headers.get(name) ?? undefined
    const v = headers[name] ?? headers[name.toLowerCase()]
    return Array.isArray(v) ? v[0] : v
  }

  // Prefer x-real-ip (proxy-set on Vercel), then the leftmost x-forwarded-for.
  const realIp = get("x-real-ip")?.trim()
  if (realIp) return realIp

  const forwarded = get("x-forwarded-for")
  if (forwarded) return forwarded.split(",")[0]!.trim()

  return "unknown"
}
