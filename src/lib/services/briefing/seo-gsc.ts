import { fetchWithTimeout } from './http'
import type { Section, GscData } from './types'

/**
 * Google Search Console — organic search performance (clicks, impressions,
 * CTR, average position, top queries). Free, but requires a Google service
 * account granted read access on the GSC property:
 *
 *   GSC_SA_EMAIL        the service-account email
 *   GSC_SA_PRIVATE_KEY  its PEM private key (PKCS8; literal \n allowed)
 *   GSC_SITE_URL        the property, e.g. "sc-domain:pleiad.io" or "https://pleiad.io/"
 *
 * We mint a short-lived OAuth token by signing a JWT with RS256 via WebCrypto
 * (works on the Cloudflare Worker runtime — no googleapis SDK needed). GSC data
 * lags ~2–3 days, so we report the most recent settled day.
 */

const TOKEN_URL = 'https://oauth2.googleapis.com/token'
const SCOPE = 'https://www.googleapis.com/auth/webmasters.readonly'

function b64url(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)
  let bin = ''
  for (const b of arr) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function pemToPkcs8(pem: string): ArrayBuffer {
  const body = pem
    .replace(/\\n/g, '\n')
    .replace(/-----BEGIN [^-]+-----/, '')
    .replace(/-----END [^-]+-----/, '')
    .replace(/\s+/g, '')
  const bin = atob(body)
  const buf = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i)
  return buf.buffer
}

async function mintToken(email: string, privateKeyPem: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  const header = b64url(new TextEncoder().encode(JSON.stringify({ alg: 'RS256', typ: 'JWT' })))
  const claims = b64url(
    new TextEncoder().encode(
      JSON.stringify({ iss: email, scope: SCOPE, aud: TOKEN_URL, iat: now, exp: now + 3600 }),
    ),
  )
  const signingInput = `${header}.${claims}`

  const key = await crypto.subtle.importKey(
    'pkcs8',
    pemToPkcs8(privateKeyPem),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(signingInput))
  const jwt = `${signingInput}.${b64url(sig)}`

  const res = await fetchWithTimeout(TOKEN_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  })
  const json = (await res.json()) as { access_token?: string; error_description?: string }
  if (!json.access_token) throw new Error(json.error_description || 'token exchange failed')
  return json.access_token
}

function settledDay(): string {
  const d = new Date(Date.now() - 3 * 86400_000)
  return d.toISOString().slice(0, 10)
}

async function queryGsc(token: string, site: string, body: object): Promise<{ rows?: Array<{ keys?: string[]; clicks: number; impressions: number; ctr: number; position: number }> }> {
  const res = await fetchWithTimeout(
    `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(site)}/searchAnalytics/query`,
    {
      method: 'POST',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify(body),
    },
  )
  if (!res.ok) throw new Error(`GSC query ${res.status}: ${await res.text().catch(() => '')}`)
  return res.json()
}

export async function collectGsc(): Promise<Section<GscData>> {
  const email = process.env.GSC_SA_EMAIL
  const key = process.env.GSC_SA_PRIVATE_KEY
  const site = process.env.GSC_SITE_URL
  if (!email || !key || !site) {
    return {
      connected: false,
      reason: 'Search Console not connected — set GSC_SA_EMAIL, GSC_SA_PRIVATE_KEY, GSC_SITE_URL.',
    }
  }

  try {
    const token = await mintToken(email, key)
    const day = settledDay()

    const [totals, top] = await Promise.all([
      queryGsc(token, site, { startDate: day, endDate: day }),
      queryGsc(token, site, { startDate: day, endDate: day, dimensions: ['query'], rowLimit: 5 }),
    ])

    const t = totals.rows?.[0]
    return {
      connected: true,
      day,
      clicks: Math.round(t?.clicks ?? 0),
      impressions: Math.round(t?.impressions ?? 0),
      ctrPct: t ? Math.round(t.ctr * 1000) / 10 : 0,
      avgPosition: t ? Math.round(t.position * 10) / 10 : 0,
      topQueries: (top.rows ?? []).map((r) => ({
        query: r.keys?.[0] ?? '(unknown)',
        clicks: Math.round(r.clicks),
        impressions: Math.round(r.impressions),
        position: Math.round(r.position * 10) / 10,
      })),
    }
  } catch (err) {
    return { connected: false, reason: `Search Console error: ${(err as Error).message}` }
  }
}
