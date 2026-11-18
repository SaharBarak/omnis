import { describe, expect, it } from 'vitest'
import { redactText, redactValue } from './redact'

describe('redactText', () => {
  it('removes one-time codes and signed tokens from URLs', () => {
    expect(redactText('https://pleiad.io/auth/callback?code=abc123&redirectTo=/app')).toBe(
      'https://pleiad.io/auth/callback?code=redacted&redirectTo=/app'
    )
    expect(redactText('https://pleiad.io/api/newsletter/confirm?email=a%40b.co&exp=1&sig=deadbeef')).toBe(
      'https://pleiad.io/api/newsletter/confirm?email=redacted&exp=1&sig=redacted'
    )
    expect(redactText('https://pleiad.io/app#access_token=eyJ.x.y&refresh_token=zzz')).toBe(
      'https://pleiad.io/app#access_token=redacted&refresh_token=redacted'
    )
  })

  it('removes the bearer token from share paths', () => {
    expect(redactText('https://pleiad.io/share/9f8e7d6c?ref=x')).toBe('https://pleiad.io/share/redacted?ref=x')
    expect(redactText('/shared/abc-123')).toBe('/shared/redacted')
  })

  it('leaves ordinary URLs alone', () => {
    const url = 'https://pleiad.io/calculate?utm_source=newsletter&barcode=1'
    expect(redactText(url)).toBe(url)
  })
})

describe('redactValue', () => {
  it('walks nested properties and keeps non-strings', () => {
    expect(
      redactValue({
        $current_url: 'https://pleiad.io/login?token=t',
        kin: 7,
        is_self: true,
        nested: { list: ['/x?sig=1', 2, null] },
      })
    ).toEqual({
      $current_url: 'https://pleiad.io/login?token=redacted',
      kin: 7,
      is_self: true,
      nested: { list: ['/x?sig=redacted', 2, null] },
    })
  })

  it('replaces credentials by property name, and leaves the SDK token and email alone', () => {
    expect(
      redactValue({ password: 'hunter2', nested: { Authorization: 'Bearer x' }, token: 'phc_x', email: 'a@b.co' })
    ).toEqual({
      password: 'redacted',
      nested: { Authorization: 'redacted' },
      token: 'phc_x',
      email: 'a@b.co',
    })
  })

  it('passes undefined through', () => {
    expect(redactValue(undefined)).toBeUndefined()
  })
})
