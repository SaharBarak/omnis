import { describe, expect, it } from 'vitest'
import { lordOfTheNight } from './lords-of-night'
import { PLACE_DAYS } from './long-count'

/** Kettunen and Helmke, Introduction to Maya Hieroglyphs (2020), pp. 51–52: G9 on the era base and every period ending, G1 the day after. */
describe('lordOfTheNight', () => {
  it('sets G9 on the era base and on every tun, k\'atun and b\'ak\'tun ending', () => {
    for (const days of [0, PLACE_DAYS.tun, PLACE_DAYS.katun * 9, PLACE_DAYS.baktun * 13]) expect(lordOfTheNight(days)).toEqual({ n: 9, glyph: 'G9' })
  })

  it('steps one lord a day, G1 after G9, before the era base as after it', () => {
    expect([1, 2, 8, 9, 10].map((d) => lordOfTheNight(d).glyph)).toEqual(['G1', 'G2', 'G8', 'G9', 'G1'])
    expect([-1, -8, -9].map((d) => lordOfTheNight(d).glyph)).toEqual(['G8', 'G1', 'G9'])
  })
})
