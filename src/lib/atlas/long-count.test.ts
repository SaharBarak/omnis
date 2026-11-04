import { describe, expect, it } from 'vitest'
import { buildLongCount } from './long-count'
import { LARGEST } from './maya-numeral'

describe('buildLongCount', () => {
  it('reads the sample and the end of the thirteenth baktun', () => {
    expect(buildLongCount('1991-03-14')).toMatchObject({ places: [12, 18, 17, 16, 7], date: '12.18.17.16.7', round: "7 Manik' 0 Kumku" })
    expect(buildLongCount('2012-12-21').date).toBe('13.0.0.0.0')
  })

  it('carries a count past 19 baktuns into the place above, so every place is one numeral', () => {
    expect(buildLongCount('5000-01-01').places).toEqual([1, 0, 11, 10, 9, 10])
    expect(buildLongCount('9999-12-31').date).toBe('1.13.5.3.6.1')
    for (const date of ['0001-01-01', '1000-06-15', '4772-10-13', '9999-12-31']) {
      expect(buildLongCount(date).places.every((place) => place >= 0 && place <= LARGEST)).toBe(true)
    }
  })

  it('orders readings by day, so a later date rolls up', () => {
    expect(buildLongCount('1991-03-15').days - buildLongCount('1991-03-14').days).toBe(1)
  })
})
