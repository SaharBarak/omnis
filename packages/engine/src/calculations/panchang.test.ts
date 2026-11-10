import { describe, expect, it } from 'vitest'
import { INDIA_HOURS, daysOfMonth, indiaTime, lunarMonthAt, nextObservances, nextSankranti, panchang, panchangDay, sunriseOn, tithiBegins, tithiDay, tithiNumbered } from './panchang'
import { midnightInZone } from './day-search'

/**
 * Published values: Drik Panchang (drikpanchang.com) for Ujjain, its times
 * in IST. 8 November 2026 at sunrise is Krishna Chaturdashi (to 11:27),
 * Swati, Ayushman, Shakuni, Ravivara, in Ashvin amanta and Kartika
 * purnimanta; 24 July 2026 Shukla Dashami (to 09:12), Anuradha, Shukla yoga,
 * Garija, in Ashadha; 25 May 2026 Shukla Dashami, Uttara Phalguni, Vajra,
 * Taitila, in Adhika Jyeshtha (17 May to 15 June). The Ekadashis after 8
 * November fall on the 20th (its tithi from 07:15 on the 20th to 06:31 on
 * the 21st, so no sunrise falls in it), on 4 December and on 20 December.
 * The Sun enters sidereal Vrishchika on 16 November. Drik's tithi times run
 * a minute or two from this ephemeris's, so a time is held within three.
 */

const minutes = (time: string): number => Number(time.slice(0, 2)) * 60 + Number(time.slice(3))
const near = (time: string, published: string): boolean => Math.abs(minutes(time) - minutes(published)) <= 3

describe('the five limbs at sunrise in Ujjain', () => {
  it.each([
    ['2026-11-08', { tithi: 'Krishna Chaturdashi', nakshatra: 'Swati', yoga: 'Ayushman', karana: 'Shakuni', vara: 'Ravivara', month: 'Ashvin', purnimanta: 'Kartika' }],
    ['2026-07-24', { tithi: 'Shukla Dashami', nakshatra: 'Anuradha', yoga: 'Shukla', karana: 'Garija', vara: 'Shukravara', month: 'Ashadha', purnimanta: 'Ashadha' }],
    ['2026-05-25', { tithi: 'Shukla Dashami', nakshatra: 'Uttara Phalguni', yoga: 'Vajra', karana: 'Taitila', vara: 'Somavara', month: 'Adhika Jyeshtha', purnimanta: 'Adhika Jyeshtha' }],
  ])('reads %s as the almanac does', (day, limbs) => {
    expect(panchang(day)).toMatchObject(limbs)
  })

  it("names the nakshatra's lord and deity, the vara's lord, and Vishti where it rules", () => {
    const day = panchangDay('2026-11-08')
    expect(day.nakshatra).toMatchObject({ n: 15, deity: 'Vayu', lord: { name: 'Rahu' } })
    expect(day.vara).toMatchObject({ lord: 'sun', lordName: 'Sun' })
    expect(day.vishti).toBe(false)
    expect(sunriseOn('2026-11-08') > midnightInZone('2026-11-08', INDIA_HOURS)).toBe(true)
  })
})

describe('the tithis in time', () => {
  it('times a tithi as it begins, in IST', () => {
    const from = midnightInZone('2026-11-08', INDIA_HOURS)
    const amavasya = tithiBegins(30, from)
    expect(amavasya.date).toBe('2026-11-08')
    expect(near(indiaTime(amavasya.at), '11:27')).toBe(true)
    const dwadashi = tithiBegins(11, midnightInZone('2026-07-24', INDIA_HOURS))
    expect(dwadashi.date).toBe('2026-07-24')
    expect(near(indiaTime(dwadashi.at), '09:12')).toBe(true)
  })

  it('keeps an Ekadashi on its sunrise, or on the day it begins where no sunrise falls in it', () => {
    const from = midnightInZone('2026-11-08', INDIA_HOURS)
    const shukla = tithiDay(11, from)
    expect(shukla).toMatchObject({ day: '2026-11-20', sunrises: 0 })
    expect(near(indiaTime(shukla.begins.at), '07:15')).toBe(true)
    expect(near(indiaTime(shukla.ends.at), '06:31')).toBe(true)
    expect(tithiDay(26, from).day).toBe('2026-12-04')
    expect(tithiDay(11, midnightInZone('2026-12-05', INDIA_HOURS)).day).toBe('2026-12-20')
    expect(tithiNumbered(26)).toMatchObject({ paksha: 'Krishna', name: 'Ekadashi', devanagari: 'एकादशी' })
  })

  it('finds the next Ekadashi, Purnima and Amavasya from a day on', () => {
    const next = nextObservances('2026-11-08')
    expect([next.ekadashi.day, next.purnima.begins.date, next.amavasya.begins.date]).toEqual(['2026-11-20', '2026-11-23', '2026-11-08'])
    expect(nextObservances('2026-11-21').ekadashi.day).toBe('2026-12-04')
  })
})

describe('the month', () => {
  it('runs amanta from new Moon to new Moon, its days by their sunrises, adhika where the Sun enters no rashi', () => {
    const ashvin = lunarMonthAt(sunriseOn('2026-11-08'))
    expect(ashvin).toMatchObject({ name: 'Ashvin', adhika: false, begins: { date: '2026-10-10' }, ends: { date: '2026-11-09' }, rashi: { name: 'Tula' } })
    const days = daysOfMonth(ashvin)
    expect([days[0], days[days.length - 1], days.length]).toEqual(['2026-10-11', '2026-11-09', 30])
    expect(lunarMonthAt(sunriseOn('2026-05-25'))).toMatchObject({ name: 'Jyeshtha', adhika: true, words: 'Adhika Jyeshtha', begins: { date: '2026-05-17' }, ends: { date: '2026-06-15' } })
  })

  it('finds the next sankranti', () => {
    expect(nextSankranti(midnightInZone('2026-11-08', INDIA_HOURS))).toMatchObject({ date: '2026-11-16', rashi: { name: 'Vrishchika' } })
  })
})
