import { describe, expect, it } from 'vitest'
import { IDLE, inspect, type InspectEvent, type InspectState } from './inspect'
import type { AtlasMarkRef } from '@/lib/atlas/marks'

const sun: AtlasMarkRef = { kind: 'planet', id: 'sun' }
const moon: AtlasMarkRef = { kind: 'planet', id: 'moon' }

const run = (...events: InspectEvent[]): InspectState => events.reduce(inspect, IDLE)

describe('inspect', () => {
  it('opens a card under the pointer and closes it when the pointer leaves the marks', () => {
    expect(run({ type: 'point', ref: sun })).toMatchObject({ active: sun, kept: false })
    expect(run({ type: 'point', ref: sun }, { type: 'point', ref: null })).toMatchObject({ active: null, shown: sun })
  })

  it('returns the same state while the pointer stays on one mark', () => {
    const over = run({ type: 'point', ref: sun })
    expect(inspect(over, { type: 'point', ref: { kind: 'planet', id: 'sun' } })).toBe(over)
    expect(inspect(IDLE, { type: 'point', ref: null })).toBe(IDLE)
  })

  it('keeps a tapped card while the pointer moves over other marks', () => {
    const kept = run({ type: 'keep', ref: sun }, { type: 'point', ref: moon }, { type: 'point', ref: null })
    expect(kept).toMatchObject({ active: sun, kept: true })
  })

  it('closes a kept card on a second tap, and keeps it closed until the pointer finds another mark', () => {
    const closed = run({ type: 'keep', ref: sun }, { type: 'keep', ref: sun })
    expect(closed).toMatchObject({ active: null, kept: false, muted: 'planet:sun' })
    expect(inspect(closed, { type: 'point', ref: sun }).active).toBeNull()
    expect(inspect(closed, { type: 'point', ref: moon }).active).toEqual(moon)
  })

  it('dismisses on Escape without reopening under a still pointer', () => {
    const dismissed = run({ type: 'point', ref: sun }, { type: 'dismiss' })
    expect(dismissed).toMatchObject({ active: null, muted: 'planet:sun' })
    expect(inspect(dismissed, { type: 'point', ref: sun }).active).toBeNull()
    expect(inspect(inspect(dismissed, { type: 'point', ref: null }), { type: 'point', ref: sun }).active).toEqual(sun)
  })

  it('lets keyboard focus replace a kept card, never describing the new mark with the old words', () => {
    expect(run({ type: 'keep', ref: sun }, { type: 'focus', ref: moon })).toMatchObject({ active: moon, kept: false, shown: moon })
  })

  it('closes on blur unless the card is kept', () => {
    expect(run({ type: 'focus', ref: sun }, { type: 'blur' }).active).toBeNull()
    expect(run({ type: 'keep', ref: sun }, { type: 'blur' }).active).toEqual(sun)
  })

  it('forgets everything when the atlas changes', () => {
    expect(run({ type: 'keep', ref: sun }, { type: 'reset' })).toBe(IDLE)
  })
})
