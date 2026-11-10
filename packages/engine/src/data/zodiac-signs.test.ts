import { describe, expect, it } from 'vitest'
import { EXALTATIONS, TRADITIONAL_RULERS, TRIPLICITY_RULERS, ZODIAC_SIGNS, decanAt, detrimentIn, fallIn, polarityOf } from './zodiac-signs'

/** The Chaldean faces, as Lilly's table sets them: Aries Mars, Sun, Venus; Scorpio Mars, Sun, Venus; Pisces Saturn, Jupiter, Mars. */
describe('decanAt', () => {
  it('runs the decans on from Mars at Aries, in Chaldean order', () => {
    expect([0, 10, 20].map((l) => decanAt(l).ruler)).toEqual(['mars', 'sun', 'venus'])
    expect([210, 220, 236].map((l) => decanAt(l))).toEqual([
      { decan: 1, ruler: 'mars' },
      { decan: 2, ruler: 'sun' },
      { decan: 3, ruler: 'venus' },
    ])
    expect([330, 340, 359.9].map((l) => decanAt(l).ruler)).toEqual(['saturn', 'jupiter', 'mars'])
  })
})

/**
 * The essential dignities as the tradition tabulates them (Lilly, Christian
 * Astrology, 1647, the table of essential dignities; Ptolemy, Tetrabiblos
 * I.12, I.17, I.19): the domicile lords, the exaltations at their degrees,
 * detriment and fall opposite them; the triplicity lords by day, by night
 * and participating as Dorotheus gives them (Carmen Astrologicum I.1).
 */
describe('dignities', () => {
  const sign = (id: string) => ZODIAC_SIGNS.find((s) => s.id === id)
  it('gives each sign its traditional lord, Mars in Scorpio, Saturn in Aquarius, Jupiter in Pisces', () => {
    expect(ZODIAC_SIGNS.map((s) => TRADITIONAL_RULERS[s.id])).toEqual(['mars', 'venus', 'mercury', 'moon', 'sun', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'saturn', 'jupiter'])
  })

  it('exalts the seven at their degrees, and sets detriment and fall opposite', () => {
    expect(Object.entries(EXALTATIONS).map(([id, e]) => `${e?.planet} ${e?.degree} ${id}`)).toEqual([
      'sun 19 aries',
      'moon 3 taurus',
      'jupiter 15 cancer',
      'mercury 15 virgo',
      'saturn 21 libra',
      'mars 28 capricorn',
      'venus 27 pisces',
    ])
    const scorpio = sign('scorpio')
    const aries = sign('aries')
    const libra = sign('libra')
    expect(scorpio && [detrimentIn(scorpio), fallIn(scorpio)]).toEqual(['venus', 'moon'])
    expect(aries && [detrimentIn(aries), fallIn(aries)]).toEqual(['venus', 'saturn'])
    expect(libra && [detrimentIn(libra), fallIn(libra)]).toEqual(['mars', 'sun'])
    expect(sign('leo') && fallIn(sign('leo') ?? ZODIAC_SIGNS[0])).toBeUndefined()
  })

  it('gives the Dorothean triplicity lords and the signs their genders', () => {
    expect(TRIPLICITY_RULERS).toEqual({
      fire: { day: 'sun', night: 'jupiter', participating: 'saturn' },
      earth: { day: 'venus', night: 'moon', participating: 'mars' },
      air: { day: 'saturn', night: 'mercury', participating: 'jupiter' },
      water: { day: 'venus', night: 'mars', participating: 'moon' },
    })
    expect(ZODIAC_SIGNS.slice(0, 4).map(polarityOf)).toEqual(['masculine', 'feminine', 'masculine', 'feminine'])
  })
})
