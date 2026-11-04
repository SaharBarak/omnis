import { describe, expect, it } from 'vitest'
import { bodyValue, signsOf } from './place'
import type { SkyBody } from './types'

const moon = (longitude: number, arc: readonly [number, number] | null): SkyBody => ({
  id: 'moon',
  name: 'Moon',
  symbol: '☽',
  src: null,
  longitude,
  arc,
  sign: { n: Math.floor(longitude / 30) + 1, name: longitude < 330 ? 'Aquarius' : 'Pisces', src: '' },
  degree: Math.floor(longitude % 30),
  retrograde: false,
})

describe('signsOf', () => {
  it('names one sign when the place is known', () => {
    expect(signsOf(moon(320, null)).map((s) => s.name)).toEqual(['Aquarius'])
  })

  it('names both signs when the day’s arc crosses into the next, as the readout states the arc', () => {
    const crossing = moon(332, [324, 337])
    expect(signsOf(crossing).map((s) => s.name)).toEqual(['Aquarius', 'Pisces'])
    expect(bodyValue(crossing)).toBe('Aquarius 24° to Pisces 7°')
  })

  it('names one sign when the arc stays inside it', () => {
    expect(signsOf(moon(305, [301, 314])).map((s) => s.name)).toEqual(['Aquarius'])
  })
})
