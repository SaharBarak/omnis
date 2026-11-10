import { describe, expect, it } from 'vitest'
import { gateChanges, gateLines, lunationOn, memoSky, moonQuarters, moonQuartersBetween, seasonOn, signEntered, signIngresses } from './sky-dates'
import { MANDALA_SEQUENCE_FULL } from '../data/human-design-gates'

/**
 * Read off sources outside the code (USNO-based phase tables, ephemeris
 * ingress tables): from 2026-11-08 the Moon is new on 9 November 07:02 UTC,
 * at first quarter on 17 November 11:47, full on 24 November 14:53 and at
 * last quarter on 1 December 06:08; the Sun enters Sagittarius on
 * 22 November 07:23 UTC and Capricorn at the solstice, 21 December 20:50.
 */
const DAY = '2026-11-08'
const sky = memoSky()

describe('moonQuarters', () => {
  it('finds the next four quarters on their civil dates, nearest first', () => {
    expect(moonQuarters(DAY, sky).map(({ phase, date, inDays }) => [phase, date, inDays])).toEqual([
      ['New Moon', '2026-11-09', 1],
      ['First Quarter', '2026-11-17', 9],
      ['Full Moon', '2026-11-24', 16],
      ['Last Quarter', '2026-12-01', 23],
    ])
  })

  it('dates a quarter later today, after the noon it is read at, today', () => {
    expect(moonQuarters('2026-11-24', sky)[0]).toMatchObject({ phase: 'Full Moon', date: '2026-11-24', inDays: 0 })
  })

  it('looks past a quarter that fell earlier today to the next one', () => {
    const fromNew = moonQuarters('2026-11-09', sky)
    expect(fromNew[fromNew.length - 1]).toMatchObject({ phase: 'New Moon', date: '2026-12-09' })
  })
})

describe('signIngresses', () => {
  it('finds the next signs the Sun enters, across the solstice', () => {
    expect(signIngresses(DAY, 2, 'tropical', sky)).toEqual([
      { sign: 'Sagittarius', date: '2026-11-22', inDays: 14, noon: '2026-11-22' },
      { sign: 'Capricorn', date: '2026-12-21', inDays: 43, noon: '2026-12-22' },
    ])
  })

  it('closes the circle from Pisces into Aries', () => {
    expect(signIngresses('2027-03-10', 1, 'tropical', sky)[0]).toMatchObject({ sign: 'Aries', date: '2027-03-20' })
  })

  it('dates an ingress later today, after noon UTC, today', () => {
    expect(signIngresses('2026-12-21', 1, 'tropical', sky)[0]).toMatchObject({ sign: 'Capricorn', date: '2026-12-21', inDays: 0 })
  })

  it('reads the sidereal Sun a sign behind, entering the sign the tropical Sun has left', () => {
    expect(signIngresses(DAY, 1, 'sidereal', sky)[0]?.sign).toBe('Scorpio')
  })
})

describe('gateChanges', () => {
  it('moves the Sun onto its next line and into the next gate on the wheel, not the next number', () => {
    const changes = gateChanges(DAY, sky)
    const after = MANDALA_SEQUENCE_FULL[(MANDALA_SEQUENCE_FULL.indexOf(1) + 1) % MANDALA_SEQUENCE_FULL.length]
    expect(changes?.gate.gate).toBe(after)
    expect(changes?.gate.gate).toBe(43)
    expect(changes?.line).toMatchObject({ gate: 1, line: 5, inDays: 1 })
    expect(changes!.gate.inDays).toBeGreaterThan(changes!.line.inDays)
  })
})

/**
 * The runs a board's calendar lays out, read at noon UTC (BENTO_V2.md "Rows
 * open their calendar's board"), for 2026-11-08: the new Moons of 10 October
 * (15:50 UTC) and 9 November (07:02), so the lunation's first noon is 11
 * October's and its last 8 November's; the Sun in Scorpio from 23 October to
 * 22 November, and in sidereal Libra (Lahiri) from 17 October's evening.
 */
describe('the runs of days a board lays out', () => {
  const sky = memoSky()

  it("counts the lunation's days from the first noon after its new Moon", () => {
    expect(lunationOn('2026-11-08', sky)).toEqual({ first: '2026-10-11', last: '2026-11-08', length: 29, at: 29 })
    expect(lunationOn('2026-11-09', sky)).toMatchObject({ first: '2026-11-09', at: 1 })
  })

  it("lays out a sign's season by the noons it holds, and dates its ingress by the instant", () => {
    expect(seasonOn('2026-11-08', 'tropical', sky)).toEqual({ first: '2026-10-23', last: '2026-11-21', length: 30, at: 17 })
    expect(signEntered('2026-11-08', 'tropical', sky)).toEqual({ date: '2026-10-23', inDays: -16, sign: 'Scorpio', noon: '2026-10-23' })
    expect(signEntered('2026-11-08', 'sidereal', sky)).toEqual({ date: '2026-10-17', inDays: -22, sign: 'Libra', noon: '2026-10-18' })
    expect(seasonOn('2026-11-08', 'sidereal', sky)).toMatchObject({ first: '2026-10-18', at: 22 })
  })

  it("marks an ingress on the season's first noon, the day after its date where it falls after noon", () => {
    for (const day of ['2026-02-20', '2026-03-25', '2026-07-30', '2026-12-25', '2026-11-08']) {
      for (const zodiac of ['tropical', 'sidereal'] as const) expect(signEntered(day, zodiac, sky)?.noon, `${day} ${zodiac}`).toBe(seasonOn(day, zodiac, sky).first)
    }
  })

  it('searches a year of ingresses a sign at a time, past the half turn', () => {
    const year = signIngresses('2026-11-08', 12, 'tropical', sky)
    expect(year.map((i) => i.sign)).toHaveLength(12)
    expect(Object.fromEntries(year.map((i) => [i.sign, i.date]))).toMatchObject({
      Capricorn: '2026-12-21',
      Aries: '2027-03-20',
      Cancer: '2027-06-21',
      Libra: '2027-09-23',
      Scorpio: '2027-10-23',
    })
  })

  it("dates each of the gate's six lines as the Sun reaches it, before and after the day", () => {
    expect(gateLines('2026-11-08', sky).map(({ line, date }) => [line, date])).toEqual([
      [1, '2026-11-05'],
      [2, '2026-11-06'],
      [3, '2026-11-07'],
      [4, '2026-11-08'],
      [5, '2026-11-09'],
      [6, '2026-11-10'],
    ])
  })
})

describe('moonQuartersBetween', () => {
  it("dates every quarter whose noon falls in a span, those before the day too, each on the first noon past it", () => {
    expect(moonQuartersBetween('2026-11-08', '2026-11-01', '2026-11-30').map(({ phase, date, inDays, noon }) => [phase, date, inDays, noon])).toEqual([
      ['Last Quarter', '2026-11-01', -7, '2026-11-02'],
      ['New Moon', '2026-11-09', 1, '2026-11-09'],
      ['First Quarter', '2026-11-17', 9, '2026-11-17'],
      ['Full Moon', '2026-11-24', 16, '2026-11-25'],
    ])
  })

  it("holds one new Moon in a lunation, on its first noon", () => {
    for (const day of ['2025-12-20', '2026-07-14', '2026-09-11', '2026-02-18', '2026-05-17', '2026-08-13', '2026-10-11']) {
      const run = lunationOn(day, sky)
      const news = moonQuartersBetween(day, run.first, run.last, sky).filter((q) => q.phase === 'New Moon')
      expect(news.map((q) => q.noon), day).toEqual([run.first])
    }
  })
})
