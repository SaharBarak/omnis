/**
 * Paddle webhook source-IP allowlist — defense-in-depth on top of the HMAC
 * signature check in the webhook handler.
 *
 * The allowed addresses are fetched live from Paddle's own endpoint (the source
 * of truth, which can change), never hard-coded. The list is cached in module
 * scope with a TTL. If the list can't be fetched we **fail open** — the
 * signature verification is the primary control, and we don't want a transient
 * Paddle API blip to drop legitimate webhook deliveries.
 *
 * Docs: https://developer.paddle.com/webhooks/verification (IP allowlisting)
 * Live IPs: https://api.paddle.com/ips  → `data.ipv4_cidrs` (/32 CIDRs)
 */
const IPS_URL = 'https://api.paddle.com/ips'
const TTL_MS = 60 * 60 * 1000 // refresh hourly

let cache: { ips: Set<string>; at: number } | null = null

async function loadPaddleIps(now: number): Promise<Set<string> | null> {
  if (cache && now - cache.at < TTL_MS) return cache.ips
  try {
    const res = await fetch(IPS_URL)
    if (!res.ok) return cache?.ips ?? null
    const json = (await res.json()) as { data?: { ipv4_cidrs?: string[] } }
    const cidrs = json.data?.ipv4_cidrs ?? []
    if (cidrs.length === 0) return cache?.ips ?? null
    // Paddle returns /32 CIDRs (single hosts) — match on the bare address.
    const ips = new Set(cidrs.map((c) => c.split('/')[0]))
    cache = { ips, at: now }
    return ips
  } catch {
    return cache?.ips ?? null
  }
}

/**
 * True if `ip` is an allowed Paddle source address — or if the allowlist is
 * currently unavailable (fail-open; signature remains the primary control).
 */
export async function isAllowedPaddleIp(ip: string | null, now: number): Promise<boolean> {
  const ips = await loadPaddleIps(now)
  if (!ips || ips.size === 0) return true // list unavailable → don't block
  if (!ip) return false
  return ips.has(ip)
}
