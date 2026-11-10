import { describe, expect, it } from 'vitest'
import { eclipsesIn, isSupermoon, lunarApsides, moonEntersSign, moonQuartersIn, noonDayOf, solarTurnings, sunReaches, type Instant } from './sky-events'

/**
 * The sky's instants against the almanacs: the equinoxes and solstices of
 * 2026 (USNO, NASA: 20 March 14:46, 21 June 08:24, 23 September 00:05,
 * 21 December 20:50 UTC); the Moon's quarters of November 2026 (last quarter
 * 1 November 20:30, new 9 November 07:02, first quarter 17 November 11:48,
 * full 24 November 14:54 UTC); its apogee of 13 November 17:50 and perigee of
 * 25 November 20:58 at 359,348 km (lunaf.com); the full supermoons of 24
 * November and 24 December 2026 (Espenak's table, by Nolle's definition);
 * the eclipses of 2026 and 2027 (NASA, Espenak); the Sun entering Scorpio on
 * 23 October 2026 at 09:37 UTC and Sagittarius on 22 November at 07:23 UTC
 * (Drik Panchang's sayana Vrischika Sankranti, 02:37 PDT; Astrolis); the
 * Moon entering Sagittarius, Capricorn, Aquarius and Pisces on 10, 12, 15
 * and 17 November 2026 (Authority Astrology's ingress table).
 */
const MINUTE = 60_000
const minutesFrom = (instant: Instant, iso: string): number => Math.abs(instant.at.getTime() - Date.parse(iso)) / MINUTE

describe('solarTurnings', () => {
  it('finds the equinoxes and solstices of 2026 to the almanac’s minute', () => {
    const quarters = solarTurnings(new Date('2026-01-01T00:00:00Z'), 8).filter((t) => t.kind !== 'cross-quarter')
    expect(quarters.map((t) => t.name)).toEqual(['March equinox', 'June solstice', 'September equinox', 'December solstice'])
    const published = ['2026-03-20T14:46Z', '2026-06-21T08:24Z', '2026-09-23T00:05Z', '2026-12-21T20:50Z']
    quarters.forEach((t, i) => expect(minutesFrom(t, published[i] ?? '')).toBeLessThan(2))
  })

  it('sets the cross-quarters at 15° of the fixed signs, midway between', () => {
    const cross = solarTurnings(new Date('2026-01-01T00:00:00Z'), 8).filter((t) => t.kind === 'cross-quarter')
    expect(cross.map((t) => [t.name, t.longitude])).toEqual([
      ['Cross-quarter, 15° Aquarius', 315],
      ['Cross-quarter, 15° Taurus', 45],
      ['Cross-quarter, 15° Leo', 135],
      ['Cross-quarter, 15° Scorpio', 225],
    ])
  })
})

describe('sunReaches', () => {
  it('times the Sun entering Scorpio and Sagittarius in 2026 within two minutes', () => {
    const scorpio = sunReaches(210, new Date('2026-10-01T00:00:00Z'))
    const sagittarius = sunReaches(240, new Date('2026-11-08T12:00:00Z'))
    expect(scorpio && minutesFrom(scorpio, '2026-10-23T09:37Z')).toBeLessThanOrEqual(2)
    expect(sagittarius && minutesFrom(sagittarius, '2026-11-22T07:23Z')).toBeLessThanOrEqual(2)
  })

  it('dates the sidereal ingress into Vrishchika on 16 November 2026, as Drik Panchang does', () => {
    expect(sunReaches(210, new Date('2026-11-08T12:00:00Z'), 'sidereal')?.date).toBe('2026-11-16')
  })
})

describe('the Moon', () => {
  const from = new Date('2026-10-30T00:00:00Z')
  const to = new Date('2026-12-31T00:00:00Z')
  const quarters = moonQuartersIn(from, to)
  const apsides = lunarApsides(new Date('2026-09-01T00:00:00Z'), to)

  it('finds the quarters of November 2026 within two minutes of the almanac', () => {
    const published: readonly [string, string][] = [
      ['Last Quarter', '2026-11-01T20:30Z'],
      ['New Moon', '2026-11-09T07:02Z'],
      ['First Quarter', '2026-11-17T11:48Z'],
      ['Full Moon', '2026-11-24T14:54Z'],
    ]
    published.forEach(([phase, iso], i) => {
      expect(quarters[i]?.phase).toBe(phase)
      expect(quarters[i] && minutesFrom(quarters[i], iso)).toBeLessThanOrEqual(2)
    })
  })

  it('finds the apogee and perigee of November 2026, and the perigee’s distance', () => {
    const november = apsides.filter((a) => a.date.startsWith('2026-11'))
    expect(november.map((a) => [a.kind, a.date])).toEqual([
      ['apogee', '2026-11-13'],
      ['perigee', '2026-11-25'],
    ])
    expect(november[0] && minutesFrom(november[0], '2026-11-13T17:50Z')).toBeLessThanOrEqual(10)
    expect(november[1] && minutesFrom(november[1], '2026-11-25T20:58Z')).toBeLessThanOrEqual(10)
    expect(Math.abs((november[1]?.km ?? 0) - 359_348)).toBeLessThan(50)
  })

  it('names the full supermoons of 24 November and 24 December 2026, not the October full Moon', () => {
    const fulls = moonQuartersIn(new Date('2026-10-01T00:00:00Z'), to).filter((q) => q.phase === 'Full Moon')
    expect(fulls.map((q) => [q.date, isSupermoon(q, apsides)])).toEqual([
      ['2026-10-26', false],
      ['2026-11-24', true],
      ['2026-12-24', true],
    ])
  })

  it('dates the Moon entering its signs', () => {
    const days = ['2026-11-09', '2026-11-12', '2026-11-14', '2026-11-17']
    const entered = days.map((d) => {
      const at = Date.parse(`${d}T12:00:00Z`)
      return moonEntersSign(new Date(at), new Date(at + 86_400_000 - 1))
    })
    expect(entered.map((e) => e && [e.sign, e.date])).toEqual([
      ['Sagittarius', '2026-11-10'],
      ['Capricorn', '2026-11-12'],
      ['Aquarius', '2026-11-15'],
      ['Pisces', '2026-11-17'],
    ])
  })
})

describe('eclipsesIn', () => {
  it('lists the eclipses of 2026 and 2027 by kind', () => {
    expect(eclipsesIn(new Date('2026-01-01T00:00:00Z'), new Date('2028-01-01T00:00:00Z')).map((e) => [e.date, e.body, e.kind])).toEqual([
      ['2026-02-17', 'solar', 'annular'],
      ['2026-03-03', 'lunar', 'total'],
      ['2026-08-12', 'solar', 'total'],
      ['2026-08-28', 'lunar', 'partial'],
      ['2027-02-06', 'solar', 'annular'],
      ['2027-02-20', 'lunar', 'penumbral'],
      ['2027-07-18', 'lunar', 'penumbral'],
      ['2027-08-02', 'solar', 'total'],
      ['2027-08-17', 'lunar', 'penumbral'],
    ])
  })
})

describe('noonDayOf', () => {
  it('marks an instant on the first day whose noon is at or past it', () => {
    expect(noonDayOf(new Date('2026-11-24T14:54:00Z'))).toBe('2026-11-25')
    expect(noonDayOf(new Date('2026-11-09T07:03:00Z'))).toBe('2026-11-09')
    expect(noonDayOf(new Date('2026-11-09T12:00:00Z'))).toBe('2026-11-09')
  })
})
