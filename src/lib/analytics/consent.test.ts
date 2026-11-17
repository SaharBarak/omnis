import { describe, expect, it } from 'vitest'
import { gateFor, isSettled, needsAsking } from './consent'

describe('needsAsking', () => {
  it('asks in the EEA, the UK and Switzerland', () => {
    for (const country of ['DE', 'fr', ' IE ', 'NO', 'GB', 'CH']) {
      expect(needsAsking(country)).toBe(true)
    }
  })

  it('does not ask elsewhere', () => {
    for (const country of ['US', 'IL', 'JP', 'BR']) {
      expect(needsAsking(country)).toBe(false)
    }
  })

  it('asks when the country is unknown', () => {
    for (const country of [null, undefined, '', 'XX', 'T1', 'Germany']) {
      expect(needsAsking(country)).toBe(true)
    }
  })
})

describe('gateFor', () => {
  const undecided = { choice: null, mustAsk: null, hasPrivacySignal: false } as const

  it('loads nothing while the region is unknown', () => {
    expect(gateFor(undecided)).toBe('deciding')
  })

  it('asks where asking is required', () => {
    expect(gateFor({ ...undecided, mustAsk: true })).toBe('asking')
  })

  it('allows where silence counts as permission', () => {
    expect(gateFor({ ...undecided, mustAsk: false })).toBe('allowed')
  })

  it('treats a browser privacy signal as a refusal everywhere', () => {
    expect(gateFor({ ...undecided, mustAsk: false, hasPrivacySignal: true })).toBe('refused')
    expect(gateFor({ ...undecided, hasPrivacySignal: true })).toBe('refused')
  })

  it('lets an explicit answer outrank region and signal', () => {
    expect(gateFor({ choice: 'granted', mustAsk: true, hasPrivacySignal: true })).toBe('allowed')
    expect(gateFor({ choice: 'denied', mustAsk: false, hasPrivacySignal: false })).toBe('refused')
  })
})

describe('isSettled', () => {
  it('is true only once there is an answer', () => {
    expect(isSettled('allowed')).toBe(true)
    expect(isSettled('refused')).toBe(true)
    expect(isSettled('asking')).toBe(false)
    expect(isSettled('deciding')).toBe(false)
  })
})
