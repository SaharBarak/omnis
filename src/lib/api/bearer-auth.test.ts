import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { verifyBearer, type TokenVerifier } from './bearer-auth'

const GOOD_PAYLOAD = {
  sub: 'auth0|abc123',
  'https://pleiad.app/email': 'noa@example.com',
  'https://pleiad.app/name': 'Noa',
}

function verifierReturning(payload: Record<string, unknown>): TokenVerifier {
  return vi.fn(async () => payload)
}

describe('verifyBearer', () => {
  beforeEach(() => {
    vi.stubEnv('AUTH0_DOMAIN', 'tenant.us.auth0.com')
    vi.stubEnv('AUTH0_API_AUDIENCE', 'https://api.pleiad.app')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('returns identity for a valid token', async () => {
    const result = await verifyBearer('Bearer tok', verifierReturning(GOOD_PAYLOAD))
    expect(result).toEqual({
      id: 'auth0|abc123',
      email: 'noa@example.com',
      name: 'Noa',
    })
  })

  it('passes issuer and audience derived from env to the verifier', async () => {
    const verifier = verifierReturning(GOOD_PAYLOAD)
    await verifyBearer('Bearer tok', verifier)
    expect(verifier).toHaveBeenCalledWith('tok', {
      issuer: 'https://tenant.us.auth0.com/',
      audience: 'https://api.pleiad.app',
      jwksUrl: new URL('https://tenant.us.auth0.com/.well-known/jwks.json'),
    })
  })

  it('tolerates missing email/name claims', async () => {
    const result = await verifyBearer(
      'Bearer tok',
      verifierReturning({ sub: 'auth0|abc123' })
    )
    expect(result).toEqual({ id: 'auth0|abc123', email: '', name: null })
  })

  it('returns null when the verifier throws (bad signature/expiry/audience)', async () => {
    const verifier: TokenVerifier = vi.fn(async () => {
      throw new Error('signature verification failed')
    })
    expect(await verifyBearer('Bearer tok', verifier)).toBeNull()
  })

  it('returns null for a payload without a subject', async () => {
    expect(await verifyBearer('Bearer tok', verifierReturning({}))).toBeNull()
    expect(
      await verifyBearer('Bearer tok', verifierReturning({ sub: '' }))
    ).toBeNull()
    expect(
      await verifyBearer('Bearer tok', verifierReturning({ sub: 42 }))
    ).toBeNull()
  })

  it('returns null for non-bearer or empty authorization headers', async () => {
    const verifier = verifierReturning(GOOD_PAYLOAD)
    expect(await verifyBearer(null, verifier)).toBeNull()
    expect(await verifyBearer(undefined, verifier)).toBeNull()
    expect(await verifyBearer('', verifier)).toBeNull()
    expect(await verifyBearer('Basic dXNlcjpwdw==', verifier)).toBeNull()
    expect(await verifyBearer('Bearer ', verifier)).toBeNull()
    expect(await verifyBearer('bearer tok', verifier)).toBeNull()
    expect(verifier).not.toHaveBeenCalled()
  })

  it('fails closed when AUTH0_API_AUDIENCE is unset', async () => {
    vi.stubEnv('AUTH0_API_AUDIENCE', '')
    const verifier = verifierReturning(GOOD_PAYLOAD)
    expect(await verifyBearer('Bearer tok', verifier)).toBeNull()
    expect(verifier).not.toHaveBeenCalled()
  })

  it('fails closed when AUTH0_DOMAIN is unset', async () => {
    vi.stubEnv('AUTH0_DOMAIN', '')
    const verifier = verifierReturning(GOOD_PAYLOAD)
    expect(await verifyBearer('Bearer tok', verifier)).toBeNull()
    expect(verifier).not.toHaveBeenCalled()
  })
})
