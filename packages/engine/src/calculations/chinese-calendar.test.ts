import { describe, expect, it } from 'vitest'
import { SOLAR_TERMS } from '../data/solar-terms'
import { chineseNewYear, chineseYearOn, festivalsIn, lunarDateOn, lunarMonthOn, monthAfter, nextChineseNewYear, nextSolarTerms, solarTermOn, solarTermsOf, solarYearOn } from './chinese-calendar'

/**
 * Published values: the Hong Kong Observatory's Gregorian-Lunar Calendar
 * Conversion Tables for 2025, 2026, 2027, 2028 and 2033 (hko.gov.hk, from
 * the Purple Mountain Observatory's almanac), which give each lunar month's
 * first day, a leap month as its number repeated, and each solar term on
 * its day in Beijing; and the Spring Festival dates of the same almanacs.
 * 1954's, 2027's and 2030's new Moons fall within the hour either side of a
 * Beijing midnight; 2025 has a leap sixth month, 2028 a leap fifth and 2033
 * a leap eleventh, so 2034's year begins a month later.
 */

/** Each table's month starts, in its order: [first day, number], a repeated number the leap month. */
const HKO_MONTHS: Readonly<Record<number, readonly (readonly [string, number])[]>> = {
  2025: [['2025-01-29', 1], ['2025-02-28', 2], ['2025-03-29', 3], ['2025-04-28', 4], ['2025-05-27', 5], ['2025-06-25', 6], ['2025-07-25', 6], ['2025-08-23', 7], ['2025-09-22', 8], ['2025-10-21', 9], ['2025-11-20', 10], ['2025-12-20', 11]],
  2026: [['2026-01-19', 12], ['2026-02-17', 1], ['2026-03-19', 2], ['2026-04-17', 3], ['2026-05-17', 4], ['2026-06-15', 5], ['2026-07-14', 6], ['2026-08-13', 7], ['2026-09-11', 8], ['2026-10-10', 9], ['2026-11-09', 10], ['2026-12-09', 11]],
  2027: [['2027-01-08', 12], ['2027-02-06', 1], ['2027-03-08', 2], ['2027-04-07', 3], ['2027-05-06', 4], ['2027-06-05', 5], ['2027-07-04', 6], ['2027-08-02', 7], ['2027-09-01', 8], ['2027-09-30', 9], ['2027-10-29', 10], ['2027-11-28', 11], ['2027-12-28', 12]],
  2028: [['2028-01-26', 1], ['2028-02-25', 2], ['2028-03-26', 3], ['2028-04-25', 4], ['2028-05-24', 5], ['2028-06-23', 5], ['2028-07-22', 6], ['2028-08-20', 7], ['2028-09-19', 8], ['2028-10-18', 9], ['2028-11-16', 10], ['2028-12-16', 11]],
  2033: [['2033-01-01', 12], ['2033-01-31', 1], ['2033-03-01', 2], ['2033-03-31', 3], ['2033-04-29', 4], ['2033-05-28', 5], ['2033-06-27', 6], ['2033-07-26', 7], ['2033-08-25', 8], ['2033-09-23', 9], ['2033-10-23', 10], ['2033-11-22', 11], ['2033-12-22', 11]],
}

/** Each table's twenty-four terms on their days, from Xiaohan (Moderate Cold) in January. */
const HKO_TERMS: Readonly<Record<number, readonly string[]>> = {
  2025: ['01-05', '01-20', '02-03', '02-18', '03-05', '03-20', '04-04', '04-20', '05-05', '05-21', '06-05', '06-21', '07-07', '07-22', '08-07', '08-23', '09-07', '09-23', '10-08', '10-23', '11-07', '11-22', '12-07', '12-21'],
  2026: ['01-05', '01-20', '02-04', '02-18', '03-05', '03-20', '04-05', '04-20', '05-05', '05-21', '06-05', '06-21', '07-07', '07-23', '08-07', '08-23', '09-07', '09-23', '10-08', '10-23', '11-07', '11-22', '12-07', '12-22'],
  2027: ['01-05', '01-20', '02-04', '02-19', '03-06', '03-21', '04-05', '04-20', '05-06', '05-21', '06-06', '06-21', '07-07', '07-23', '08-08', '08-23', '09-08', '09-23', '10-08', '10-23', '11-07', '11-22', '12-07', '12-22'],
  2028: ['01-06', '01-20', '02-04', '02-19', '03-05', '03-20', '04-04', '04-19', '05-05', '05-20', '06-05', '06-21', '07-06', '07-22', '08-07', '08-22', '09-07', '09-22', '10-08', '10-23', '11-07', '11-22', '12-06', '12-21'],
  2033: ['01-05', '01-20', '02-03', '02-18', '03-05', '03-20', '04-04', '04-20', '05-05', '05-21', '06-05', '06-21', '07-07', '07-22', '08-07', '08-23', '09-07', '09-23', '10-08', '10-23', '11-07', '11-22', '12-07', '12-21'],
}

/** The table's English names, Xiaohan first, as the terms run through a Gregorian year. */
const HKO_TERM_NAMES = ['Moderate Cold', 'Severe Cold', 'Spring Commences', 'Spring Showers', 'Insects Waken', 'Vernal Equinox', 'Bright & Clear', 'Corn Rain', 'Summer Commences', 'Corn Forms', 'Corn on Ear', 'Summer Solstice', 'Moderate Heat', 'Great Heat', 'Autumn Commences', 'End of Heat', 'White Dew', 'Autumnal Equinox', 'Cold Dew', 'Frost', 'Winter Commences', 'Light Snow', 'Heavy Snow', 'Winter Solstice']

describe('the lunar months', () => {
  it.each(Object.keys(HKO_MONTHS).map(Number))('begins every month of %i on its day in Beijing, the leap month numbered as the month before', (year) => {
    const table = HKO_MONTHS[year] ?? []
    const read = table.map(([first]) => lunarMonthOn(first))
    expect(read.map((m) => [m.first, m.number])).toEqual(table)
    const leaps = read.filter((m) => m.leap).map((m) => m.first)
    const repeated = table.filter(([, n], i) => i > 0 && table[i - 1]?.[1] === n).map(([first]) => first)
    expect(leaps).toEqual(repeated)
  })

  it('names the months and days as the almanac writes them', () => {
    expect(lunarDateOn('2026-11-08')).toMatchObject({ day: 30, dayCharacters: '三十', characters: '九月三十', month: { number: 9, leap: false, first: '2026-10-10', length: 30, year: 2026 } })
    expect(lunarDateOn('2026-11-09')).toMatchObject({ day: 1, characters: '十月初一' })
    expect(lunarMonthOn('2025-07-25')).toMatchObject({ number: 6, leap: true, characters: '闰六月', length: 29 })
    expect(lunarMonthOn('2033-12-22')).toMatchObject({ number: 11, leap: true, characters: '闰冬月', year: 2033 })
    expect(lunarMonthOn('2026-01-19')).toMatchObject({ number: 12, characters: '腊月', year: 2025 })
    expect(monthAfter(lunarMonthOn('2026-11-08'))).toMatchObject({ number: 10, first: '2026-11-09' })
  })

  it('keeps the festivals on their days of the regular month, none in a leap month', () => {
    const dated = (day: string) => festivalsIn(lunarMonthOn(day)).map((f) => [f.name, f.date])
    expect(dated('2026-06-15')).toEqual([['Dragon Boat Festival', '2026-06-19']])
    expect(dated('2026-09-11')).toEqual([['Mid-Autumn Festival', '2026-09-25']])
    expect(dated('2025-07-25')).toEqual([])
  })
})

describe('the solar terms', () => {
  it.each(Object.keys(HKO_TERMS).map(Number))('dates the twenty-four of %i on their days in Beijing', (year) => {
    const terms = [...solarTermsOf(year - 1), ...solarTermsOf(year)].filter((t) => t.date.startsWith(`${year}-`))
    expect(terms.map((t) => t.date.slice(5))).toEqual(HKO_TERMS[year])
    expect(terms.map((t) => t.term.english)).toEqual(HKO_TERM_NAMES)
  })

  it('keeps a term from its day to the eve of the next, and the year of the pillars from Lichun', () => {
    expect(solarTermOn('2026-11-06').term.pinyin).toBe('Shuangjiang')
    expect(solarTermOn('2026-11-07')).toMatchObject({ date: '2026-11-07', term: { pinyin: 'Lidong', characters: '立冬', principal: false } })
    expect(solarTermOn('2026-11-08').term.pinyin).toBe('Lidong')
    expect(nextSolarTerms('2026-11-08', 3).map((t) => [t.term.pinyin, t.date])).toEqual([
      ['Xiaoxue', '2026-11-22'],
      ['Daxue', '2026-12-07'],
      ['Dongzhi', '2026-12-22'],
    ])
    expect([solarYearOn('2026-02-03'), solarYearOn('2026-02-04'), solarYearOn('2026-11-08')]).toEqual([2025, 2026, 2026])
    expect(SOLAR_TERMS.filter((t) => t.principal)).toHaveLength(12)
  })
})

describe('the Chinese year', () => {
  it.each([
    [1954, '1954-02-03'],
    [1985, '1985-02-20'],
    [2025, '2025-01-29'],
    [2026, '2026-02-17'],
    [2027, '2027-02-06'],
    [2028, '2028-01-26'],
    [2029, '2029-02-13'],
    [2030, '2030-02-03'],
    [2031, '2031-01-23'],
    [2033, '2033-01-31'],
    [2034, '2034-02-19'],
  ])('dates the year that begins in %i on %s, in Beijing', (year, date) => {
    expect(chineseNewYear(year)).toBe(date)
  })

  it('keeps the old year to the eve of the new', () => {
    expect(chineseYearOn('2027-02-05')).toBe(2026)
    expect(chineseYearOn('2027-02-06')).toBe(2027)
    expect(chineseYearOn('2030-02-02')).toBe(2029)
    expect(chineseYearOn('2030-02-03')).toBe(2030)
  })

  it('finds the next new year after a day, and past one that began today', () => {
    expect(nextChineseNewYear('2026-11-08')).toEqual({ date: '2027-02-06', inDays: 90, year: 2027 })
    expect(nextChineseNewYear('2026-02-17')).toMatchObject({ date: '2027-02-06', year: 2027 })
    expect(nextChineseNewYear('2027-01-10')).toMatchObject({ date: '2027-02-06', inDays: 27 })
  })
})
