// @vitest-environment node
import { SignJWT, exportJWK, generateKeyPair } from 'jose'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { verifyBearer } from './bearer-auth'

/**
 * Integration test: real RS256 signing + real jose JWKS verification.
 * Only the network is faked — global fetch serves our generated JWKS at the
 * tenant URL. Uses the default verifier (no test seam), so this exercises
 * createRemoteJWKSet, issuer/audience/exp checks, and claim extraction
 * exactly as production does.
 */

const DOMAIN = 'integration.pleiad.test'
const AUDIENCE = 'https://api.pleiad.app'
const ISSUER = `https://${DOMAIN}/`
const JWKS_URL = `https://${DOMAIN}/.well-known/jwks.json`

describe('verifyBearer (real crypto, mocked JWKS transport)', () => {
  let privateKey: CryptoKey
  let jwksBody: string

  beforeEach(async () => {
    vi.stubEnv('AUTH0_DOMAIN', DOMAIN)
    vi.stubEnv('AUTH0_API_AUDIENCE', AUDIENCE)
    const pair = await generateKeyPair('RS256')
    privateKey = pair.privateKey as CryptoKey
    const jwk = await exportJWK(pair.publicKey)
    jwksBody = JSON.stringify({ keys: [{ ...jwk, alg: 'RS256', use: 'sig', kid: 'itest' }] })
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input)
        if (url === JWKS_URL) {
          return new Response(jwksBody, {
            status: 200,
            headers: { 'content-type': 'application/json' },
          })
        }
        throw new Error(`unexpected fetch: ${url}`)
      })
    )
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  async function sign(
    overrides: { issuer?: string; audience?: string; expired?: boolean; sub?: string } = {}
  ): Promise<string> {
    let jwt = new SignJWT({
      'https://pleiad.app/email': 'noa@example.com',
      'https://pleiad.app/name': 'Noa',
    })
      .setProtectedHeader({ alg: 'RS256', kid: 'itest' })
      .setIssuer(overrides.issuer ?? ISSUER)
      .setAudience(overrides.audience ?? AUDIENCE)
      .setIssuedAt()
      .setExpirationTime(overrides.expired ? '-1h' : '1h')
    if (overrides.sub !== undefined) jwt = jwt.setSubject(overrides.sub)
    else jwt = jwt.setSubject('auth0|integration-user')
    return jwt.sign(privateKey)
  }

  it('accepts a properly signed token and extracts identity', async () => {
    const token = await sign()
    const identity = await verifyBearer(`Bearer ${token}`)
    expect(identity).toEqual({
      id: 'auth0|integration-user',
      email: 'noa@example.com',
      name: 'Noa',
    })
  })

  it('rejects a token signed by a different key', async () => {
    const attacker = await generateKeyPair('RS256')
    const forged = await new SignJWT({})
      .setProtectedHeader({ alg: 'RS256', kid: 'itest' })
      .setIssuer(ISSUER)
      .setAudience(AUDIENCE)
      .setSubject('auth0|attacker')
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(attacker.privateKey as CryptoKey)
    expect(await verifyBearer(`Bearer ${forged}`)).toBeNull()
  })

  it('rejects wrong audience', async () => {
    const token = await sign({ audience: 'https://other-api.example.com' })
    expect(await verifyBearer(`Bearer ${token}`)).toBeNull()
  })

  it('rejects wrong issuer', async () => {
    const token = await sign({ issuer: 'https://evil.tenant.example/' })
    expect(await verifyBearer(`Bearer ${token}`)).toBeNull()
  })

  it('rejects an expired token', async () => {
    const token = await sign({ expired: true })
    expect(await verifyBearer(`Bearer ${token}`)).toBeNull()
  })

  it('rejects a token without a subject', async () => {
    const token = await sign({ sub: '' })
    expect(await verifyBearer(`Bearer ${token}`)).toBeNull()
  })

  it('rejects tampered payloads', async () => {
    const token = await sign()
    const [h, p, s] = token.split('.')
    const payload = JSON.parse(Buffer.from(p, 'base64url').toString())
    payload.sub = 'auth0|hijacked'
    const tampered = [h, Buffer.from(JSON.stringify(payload)).toString('base64url'), s].join('.')
    expect(await verifyBearer(`Bearer ${tampered}`)).toBeNull()
  })
})
