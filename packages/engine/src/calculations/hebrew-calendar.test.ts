/**
 * Published values: Hebcal's Jewish calendar API (hebcal.com, CC BY 4.0),
 * the years 5786–5788 with Israel (i=on) and diaspora readings, fetched
 * 2026-11-09. In 5782 the 17th of Tammuz and the 9th of Av fell on
 * Shabbat and the fasts were kept on Sunday 17 July and Sunday 7 August 2022.
 */
import { describe, it, expect } from 'vitest'

import {
  hebrewDateParts,
  hebrewDayOf,
  hebrewEvesIn,
  hebrewHolidaysIn,
  hebrewHolidaysOn,
  hebrewNumeral,
  hebrewYearOf,
  moladOfMonth,
  omerDayOf,
  omerSefirot,
  roshChodeshIn,
  upcomingHebrewHolidays,
  type HebrewYear,
} from './hebrew-calendar'

const year = (day: string): HebrewYear => {
  const found = hebrewYearOf(day)
  if (!found) throw new Error(`no Hebrew year for ${day}`)
  return found
}
const Y5787 = year('2026-11-08')
const firstDays = (y: HebrewYear, reckoning: 'israel' | 'diaspora' = 'israel') =>
  new Map(hebrewHolidaysIn(y, reckoning).filter((o) => o.day === 1).map((o) => [o.holiday.id, o.date]))

describe('hebrewDateParts', () => {
  it('reads 24 July 2026 as 10 Av 5786', () => {
    expect(hebrewDateParts(new Date('2026-07-24T12:00:00Z'))).toEqual({ day: 10, month: 'Av', year: 5786, formatted: '10 Av 5786' })
  })

  it('reads the day under test as 28 Heshvan 5787', () => {
    const day = hebrewDayOf('2026-11-08')
    expect([day?.day, day?.month.month.id, day?.year.year]).toEqual([28, 'cheshvan', 5787])
  })
})

describe('hebrewNumeral', () => {
  it('writes days and years as a Hebrew date does', () => {
    expect([1, 10, 11, 15, 16, 19, 20, 28, 30].map(hebrewNumeral)).toEqual(['א׳', 'י׳', 'י״א', 'ט״ו', 'ט״ז', 'י״ט', 'כ׳', 'כ״ח', 'ל׳'])
    expect(hebrewNumeral(5787)).toBe('תשפ״ז')
    expect(hebrewNumeral(5000)).toBe('')
  })
})

describe('hebrewYearOf', () => {
  it('gives 5787 its months, length, keviah and cycles', () => {
    expect(Y5787.first).toBe('2026-09-12')
    expect([Y5787.length, Y5787.leap, Y5787.months.length]).toEqual([385, true, 13])
    expect(Y5787.keviah).toEqual({ roshHashanah: 6, kind: 'complete', pesach: 4, letters: 'זשה' })
    expect([Y5787.cycleYear, Y5787.shmitaYear]).toEqual([11, 5])
    expect(Y5787.months.map((m) => m.month.id)).toEqual(['tishrei', 'cheshvan', 'kislev', 'tevet', 'shevat', 'adar1', 'adar', 'nisan', 'iyar', 'sivan', 'tammuz', 'av', 'elul'])
  })

  it('counts the shmita: 5782 is the seventh year', () => {
    expect(year('2022-03-01').shmitaYear).toBe(7)
  })
})

describe('hebrewHolidaysIn', () => {
  it('keeps the 5787 holidays on the days Hebcal publishes for Israel', () => {
    const days = firstDays(Y5787)
    expect(Object.fromEntries(
      ['rosh-hashanah', 'tzom-gedaliah', 'yom-kippur', 'sukkot', 'shemini-atzeret', 'sigd', 'hanukkah', 'asara-btevet', 'tu-bishvat', 'purim-katan', 'taanit-esther', 'purim', 'shushan-purim',
        'yom-haaliyah', 'taanit-bechorot', 'pesach', 'yom-hashoah', 'yom-hazikaron', 'yom-haatzmaut', 'pesach-sheni', 'lag-baomer', 'yom-yerushalayim', 'shavuot', 'tzom-tammuz', 'tisha-bav', 'tu-bav'].map((id) => [id, days.get(id)]),
    )).toEqual({
      'rosh-hashanah': '2026-09-12', 'tzom-gedaliah': '2026-09-14', 'yom-kippur': '2026-09-21', sukkot: '2026-09-26', 'shemini-atzeret': '2026-10-03', sigd: '2026-11-09',
      hanukkah: '2026-12-05', 'asara-btevet': '2026-12-20', 'tu-bishvat': '2027-01-23', 'purim-katan': '2027-02-21', 'taanit-esther': '2027-03-22', purim: '2027-03-23', 'shushan-purim': '2027-03-24',
      'yom-haaliyah': '2027-04-17', 'taanit-bechorot': '2027-04-21', pesach: '2027-04-22', 'yom-hashoah': '2027-05-04', 'yom-hazikaron': '2027-05-11', 'yom-haatzmaut': '2027-05-12',
      'pesach-sheni': '2027-05-21', 'lag-baomer': '2027-05-25', 'yom-yerushalayim': '2027-06-04', shavuot: '2027-06-11', 'tzom-tammuz': '2027-07-22', 'tisha-bav': '2027-08-12', 'tu-bav': '2027-08-18',
    })
  })

  it('names Hoshana Rabba and joins Simchat Torah to Shemini Atzeret in Israel', () => {
    const israel = hebrewHolidaysIn(Y5787)
    expect(israel.find((o) => o.date === '2026-10-02')?.name).toBe('Hoshana Rabba')
    expect(israel.find((o) => o.date === '2026-10-03')?.name).toBe('Shemini Atzeret · Simchat Torah')
    expect(israel.some((o) => o.holiday.id === 'simchat-torah')).toBe(false)
  })

  it('keeps the second festival days and Simchat Torah in the diaspora', () => {
    const rest = hebrewHolidaysIn(Y5787, 'diaspora').filter((o) => o.rest).map((o) => o.date)
    expect(rest).toEqual(expect.arrayContaining(['2026-09-27', '2026-10-04', '2027-04-23', '2027-04-28', '2027-04-29', '2027-06-12']))
    expect(firstDays(Y5787, 'diaspora').get('simchat-torah')).toBe('2026-10-04')
    expect(hebrewHolidaysIn(Y5787).filter((o) => o.holiday.id === 'pesach' && o.rest).map((o) => o.date)).toEqual(['2027-04-22', '2027-04-28'])
  })

  it('moves the fasts off Shabbat and the state days off Friday, Shabbat and Monday as Hebcal does', () => {
    const y5788 = firstDays(year('2028-01-01'))
    expect(['taanit-esther', 'yom-hashoah', 'yom-hazikaron', 'yom-haatzmaut', 'sigd'].map((id) => y5788.get(id))).toEqual(['2028-03-09', '2028-04-24', '2028-05-01', '2028-05-02', '2027-11-29'])
    const y5786 = firstDays(year('2026-01-01'))
    expect(['taanit-esther', 'yom-hazikaron', 'yom-haatzmaut', 'tzom-tammuz', 'tisha-bav'].map((id) => y5786.get(id))).toEqual(['2026-03-02', '2026-04-21', '2026-04-22', '2026-07-02', '2026-07-23'])
    const fasts5782 = hebrewHolidaysIn(year('2022-03-01')).filter((o) => o.holiday.id === 'tzom-tammuz' || o.holiday.id === 'tisha-bav')
    expect(fasts5782.map((o) => [o.date, o.moved])).toEqual([['2022-07-17', 1], ['2022-08-07', 1]])
  })
})

describe('hebrewEvesIn', () => {
  it('marks the eves of the holidays that begin at sundown', () => {
    const eves = new Map(hebrewEvesIn(Y5787).map((e) => [e.holiday.id, e.date]))
    expect(['rosh-hashanah', 'yom-kippur', 'sukkot', 'hanukkah', 'purim', 'pesach', 'shavuot', 'tisha-bav'].map((id) => eves.get(id))).toEqual([
      '2026-09-11', '2026-09-20', '2026-09-25', '2026-12-04', '2027-03-22', '2027-04-21', '2027-06-10', '2027-08-11',
    ])
  })
})

describe('hebrewHolidaysOn', () => {
  it('names every holiday kept on a date in Israel', () => {
    expect(hebrewHolidaysOn(new Date('2026-12-06T12:00:00Z')).map((h) => h.id)).toEqual(['hanukkah'])
    expect(hebrewHolidaysOn(new Date('2026-11-09T12:00:00Z')).map((h) => h.id)).toEqual(['sigd'])
    expect(hebrewHolidaysOn(new Date('2026-11-08T12:00:00Z'))).toEqual([])
  })
})

describe('upcomingHebrewHolidays', () => {
  it('lists first days nearest-first, today counting as day 0', () => {
    expect(upcomingHebrewHolidays(new Date('2026-11-08T12:00:00Z'), 3).map((h) => [h.holiday.id, h.date, h.inDays])).toEqual([
      ['sigd', '2026-11-09', 1],
      ['hanukkah', '2026-12-05', 27],
      ['asara-btevet', '2026-12-20', 42],
    ])
    expect(upcomingHebrewHolidays(new Date('2026-12-05T12:00:00Z'), 1)[0]?.inDays).toBe(0)
  })

  it('crosses into the next year', () => {
    const list = upcomingHebrewHolidays(new Date('2027-08-20T12:00:00Z'), 2)
    expect(list.map((h) => [h.holiday.id, h.date])).toEqual([['rosh-hashanah', '2027-10-02'], ['tzom-gedaliah', '2027-10-04']])
  })
})

describe('roshChodeshIn', () => {
  it('keeps two days where the month before has thirty', () => {
    const rc = roshChodeshIn(Y5787).filter((r) => r.month.month.id === 'cheshvan' || r.month.month.id === 'kislev')
    expect(rc.map((r) => [r.date, r.month.month.id, r.day, r.of])).toEqual([
      ['2026-10-11', 'cheshvan', 1, 2], ['2026-10-12', 'cheshvan', 2, 2], ['2026-11-10', 'kislev', 1, 2], ['2026-11-11', 'kislev', 2, 2],
    ])
  })
})

describe('moladOfMonth', () => {
  it('announces the molad as Hebcal does', () => {
    const molad = (id: string) => {
      const month = Y5787.months.find((m) => m.month.id === id)
      if (!month) throw new Error(id)
      const m = moladOfMonth(Y5787, month)
      return [m.date, m.weekday, m.hour, m.minute, m.parts]
    }
    expect(molad('cheshvan')).toEqual(['2026-10-11', 0, 9, 43, 2])
    expect(molad('kislev')).toEqual(['2026-11-09', 1, 22, 27, 3])
    expect(molad('tevet')).toEqual(['2026-12-09', 3, 11, 11, 4])
  })
})

describe('the Omer', () => {
  it('counts from the second night of Pesach to Shavuot', () => {
    expect(omerDayOf('2027-04-23', Y5787)).toBe(1)
    expect(omerDayOf('2027-05-25', Y5787)).toBe(33)
    expect(omerDayOf('2027-06-10', Y5787)).toBe(49)
    expect(omerDayOf('2027-06-11', Y5787)).toBeNull()
  })

  it('reads Lag BaOmer as Hod of Hod, four weeks and five days', () => {
    const lag = omerSefirot(33)
    expect([lag?.day.id, lag?.week.id, lag?.weeks, lag?.days]).toEqual(['hod', 'hod', 4, 5])
  })
})
