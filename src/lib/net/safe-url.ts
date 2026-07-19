/**
 * SSRF guard shared by the listing-URL fetch and the image re-host
 * (URL/photo import). Blocks non-http(s) schemes and hosts that resolve to
 * loopback / link-local / RFC-1918 private ranges, so an attacker-controlled
 * page (or its og:image meta tag) can't point our server at internal targets.
 *
 * Note: this is a syntactic guard on the hostname, not a DNS-resolution guard —
 * it does not defend against a public hostname that resolves to a private IP.
 */
export function isSafePublicUrl(raw: string): boolean {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return false;
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") return false;
  const host = u.hostname.toLowerCase();
  if (
    host === "localhost" ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    /^(127\.|10\.|192\.168\.|169\.254\.|0\.)/.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host) ||
    host === "::1" ||
    host === "[::1]"
  ) {
    return false;
  }
  return true;
}
