import { describe, it, expect } from 'vitest'

import { readJwtSub } from './jwt'

/**
 * The `sub` we read here becomes RevenueCat's appUserID. If it is wrong, a
 * purchase attaches to the wrong account — or to none — so the malformed-input
 * paths must fail closed (null), never guess.
 */

/** Build an unsigned JWT with the given payload (signature is never checked). */
function jwt(payload: Record<string, unknown>): string {
  const b64url = (obj: unknown) =>
    Buffer.from(JSON.stringify(obj))
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '')
  return `${b64url({ alg: 'RS256' })}.${b64url(payload)}.sig`
}

describe('readJwtSub', () => {
  it('reads the sub claim', () => {
    expect(readJwtSub(jwt({ sub: 'auth0|abc123' }))).toBe('auth0|abc123')
  })

  it('handles a payload whose base64url needs re-padding', () => {
    // Lengths that are not a multiple of 4 are the ones that break naive atob.
    for (const id of ['a', 'ab', 'abc', 'abcd', 'google-oauth2|1078']) {
      expect(readJwtSub(jwt({ sub: id }))).toBe(id)
    }
  })

  it('ignores other claims', () => {
    expect(
      readJwtSub(jwt({ sub: 'auth0|x', aud: 'https://api.pleiad.app', exp: 1 }))
    ).toBe('auth0|x')
  })

  it('returns null when there is no sub', () => {
    expect(readJwtSub(jwt({ aud: 'https://api.pleiad.app' }))).toBeNull()
  })

  it('returns null for a non-string or empty sub', () => {
    expect(readJwtSub(jwt({ sub: 42 }))).toBeNull()
    expect(readJwtSub(jwt({ sub: '' }))).toBeNull()
  })

  it('returns null for malformed tokens instead of throwing', () => {
    expect(readJwtSub('')).toBeNull()
    expect(readJwtSub('not-a-jwt')).toBeNull()
    expect(readJwtSub('only.two')).toBe(null)
    expect(readJwtSub('a.!!!not-base64!!!.c')).toBeNull()
  })
})
