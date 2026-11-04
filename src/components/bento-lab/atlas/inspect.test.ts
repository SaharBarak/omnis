import { describe, expect, it } from 'vitest'
import { createInspect, IDLE, inspect, type InspectEvent, type InspectState } from './inspect'
import type { AtlasMarkRef } from '@/lib/atlas/marks'

const sun: AtlasMarkRef = { kind: 'planet', id: 'sun' }
const moon: AtlasMarkRef = { kind: 'planet', id: 'moon' }

const run = (...events: InspectEvent[]): InspectState => events.reduce(inspect, IDLE as InspectState)

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

  it('lets focus own its card: the pointer passing by neither replaces nor closes it', () => {
    const focused = run({ type: 'focus', ref: sun })
    expect(inspect(focused, { type: 'point', ref: moon })).toBe(focused)
    expect(inspect(focused, { type: 'point', ref: null })).toBe(focused)
    expect(run({ type: 'focus', ref: sun }, { type: 'blur' }, { type: 'point', ref: moon }).active).toEqual(moon)
  })

  it('keeps a focused card through a press, and lets a second press close it', () => {
    const kept = run({ type: 'focus', ref: sun }, { type: 'keep', ref: sun })
    expect(kept).toMatchObject({ active: sun, kept: true })
    expect(inspect(kept, { type: 'keep', ref: sun }).active).toBeNull()
  })
})

describe('createInspect', () => {
  it('runs the same model over any reference with a key', () => {
    const byName = createInspect<{ readonly name: string }>((ref) => ref.name)
    const a = { name: 'a' }
    const opened = byName(IDLE, { type: 'point', ref: a })
    expect(opened).toMatchObject({ active: a, shown: a })
    expect(byName(opened, { type: 'point', ref: { name: 'a' } })).toBe(opened)
  })
})

