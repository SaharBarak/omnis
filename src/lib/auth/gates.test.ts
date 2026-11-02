import { describe, expect, it } from 'vitest'
import { gateFor, gateRedirect, loginFor, loginHref, signedInGate } from './gates'
import { SITE_GATE } from '@/lib/site/routes'

describe('auth gates', () => {
  it('guards the lab app on segment boundaries, however it is spelled', () => {
    const app = SITE_GATE.prefix
    for (const path of [app, `${app}/`, `${app}/people`, `${app}/people/abc`, app.toUpperCase(), app.replace(/app$/, '%61pp')]) {
      expect(gateFor(path)?.login, path).toBe(SITE_GATE.login)
    }
    expect(gateFor(`${app}le`)).toBeUndefined()
    expect(gateFor(SITE_GATE.login)).toBeUndefined()
  })

  it('guards the live app without catching neighbours', () => {
    expect(gateFor('/app')?.login).toBe('/login')
    expect(gateFor('/app/people')?.login).toBe('/login')
    expect(gateFor('/apple')).toBeUndefined()
    expect(gateFor('/peoplesoft')).toBeUndefined()
    expect(gateFor('/learn')).toBeUndefined()
  })

  it('sends a signed-in visitor on a login page to that tree’s home', () => {
    expect(signedInGate('/login')?.home).toBe('/app')
    expect(signedInGate('/login/')?.home).toBe('/app')
    expect(signedInGate(SITE_GATE.login)?.home).toBe(SITE_GATE.home)
    expect(signedInGate('/login/help')).toBeUndefined()
  })
})

describe('gate redirects', () => {
  const back = (target: string | null) => new URL(target ?? '', 'http://probe.invalid').searchParams.get('redirectTo')

  it('sends a signed-out visitor to the owning login with the path and query intact', () => {
    const target = gateRedirect(`${SITE_GATE.prefix}/people`, '?tab=ties&x=1', false)
    expect(target?.startsWith(`${SITE_GATE.login}?`)).toBe(true)
    expect(back(target)).toBe(`${SITE_GATE.prefix}/people?tab=ties&x=1`)
    expect(back(gateRedirect('/app', '', false))).toBe('/app')
  })

  it('lets ungated and signed-in requests through, and sends a signed-in visitor off the login page', () => {
    expect(gateRedirect('/learn', '?q=1', false)).toBeNull()
    expect(gateRedirect('/app/people', '?q=1', true)).toBeNull()
    expect(gateRedirect(SITE_GATE.login, '?redirectTo=%2Fx', true)).toBe(SITE_GATE.home)
  })

  it('finds the login that owns a path, falling back to the live login', () => {
    expect(loginFor(`${SITE_GATE.prefix}/groups`)).toBe(SITE_GATE.login)
    expect(loginFor('/app/people')).toBe('/login')
    expect(loginFor('/pricing')).toBe('/login')
    expect(loginHref(`${SITE_GATE.prefix}/groups`, `${SITE_GATE.prefix}/groups?a=1`, { error: 'auth_failed' })).toBe(
      `${SITE_GATE.login}?error=auth_failed&redirectTo=${encodeURIComponent(`${SITE_GATE.prefix}/groups?a=1`)}`,
    )
  })
})
