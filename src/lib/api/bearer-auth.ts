import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from 'jose'

/**
 * Bearer-token authentication for native clients (AUTH-M1).
 *
 * Verifies an Auth0-issued RS256 access token against the tenant JWKS and
 * returns the identity, or null for anything invalid. This path is additive:
 * the web keeps using the encrypted session cookie; native apps send
 * `Authorization: Bearer <access_token>` obtained via Auth0 native PKCE with
 * audience AUTH0_API_AUDIENCE.
 *
 * Fails closed: when AUTH0_DOMAIN or AUTH0_API_AUDIENCE is unset the bearer
 * path is disabled entirely (never "verify without audience").
 *
 * Access tokens don't carry email/name by default; an Auth0 Action may add
 * them under the namespaced claims below. Absence is tolerated — routes only
 * require the subject for tenant scoping.
 */

const EMAIL_CLAIM = 'https://pleiad.app/email'
const NAME_CLAIM = 'https://pleiad.app/name'

export interface BearerIdentity {
  id: string
  email: string
  name: string | null
}

interface BearerConfig {
  issuer: string
  audience: string
  jwksUrl: URL
}

function getConfig(): BearerConfig | null {
  const domain = process.env.AUTH0_DOMAIN
  const audience = process.env.AUTH0_API_AUDIENCE
  if (!domain || !audience) return null
  return {
    issuer: `https://${domain}/`,
    audience,
    jwksUrl: new URL(`https://${domain}/.well-known/jwks.json`),
  }
}

// JWKS is cached per isolate; keyed by URL so env changes in tests don't leak.
let cachedJwks: { url: string; getKey: JWTVerifyGetKey } | null = null

function getJwks(url: URL): JWTVerifyGetKey {
  if (cachedJwks?.url !== url.href) {
    cachedJwks = { url: url.href, getKey: createRemoteJWKSet(url) }
  }
  return cachedJwks.getKey
}

/** Test seam: inject a fake verifier instead of hitting the network JWKS. */
export type TokenVerifier = (
  token: string,
  config: BearerConfig
) => Promise<Record<string, unknown>>

const defaultVerifier: TokenVerifier = async (token, config) => {
  const { payload } = await jwtVerify(token, getJwks(config.jwksUrl), {
    issuer: config.issuer,
    audience: config.audience,
    algorithms: ['RS256'],
  })
  return payload
}

/**
 * Verifies an Authorization header value. Returns the identity or null —
 * never throws (callers treat null as "not bearer-authenticated" and fall
 * through to their own 401 handling).
 */
export async function verifyBearer(
  authorization: string | null | undefined,
  verifier: TokenVerifier = defaultVerifier
): Promise<BearerIdentity | null> {
  if (!authorization?.startsWith('Bearer ')) return null
  const config = getConfig()
  if (!config) return null
  const token = authorization.slice('Bearer '.length).trim()
  if (!token) return null
  try {
    const payload = await verifier(token, config)
    const sub = payload.sub
    if (typeof sub !== 'string' || sub.length === 0) return null
    const email = payload[EMAIL_CLAIM]
    const name = payload[NAME_CLAIM]
    return {
      id: sub,
      email: typeof email === 'string' ? email : '',
      name: typeof name === 'string' ? name : null,
    }
  } catch {
    return null
  }
}
