/**
 * Published values: Hebcal's Jewish calendar API (hebcal.com, CC BY 4.0),
 * Shabbat readings for 5786–5788 in Israel (i=on) and the diaspora,
 * fetched 2026-11-09; Hebcal's spelling, curly apostrophes made straight.
 */
import { describe, it, expect } from 'vitest'

import { hebrewYearOf, type HebrewYear } from './hebrew-calendar'
import { namedShabbatot, portionsName, torahCycle, torahReadings, weekReading } from './parasha'

const year = (day: string): HebrewYear => {
  const found = hebrewYearOf(day)
  if (!found) throw new Error(`no Hebrew year for ${day}`)
  return found
}
const read = (y: HebrewYear, reckoning: 'israel' | 'diaspora') => (torahReadings(y, reckoning) ?? []).filter((r) => r.portions.length > 0)
const joined = (y: HebrewYear, reckoning: 'israel' | 'diaspora') => read(y, reckoning).filter((r) => r.portions.length > 1).map((r) => `${r.date} ${portionsName(r.portions)}`)

const ISRAEL_5787 = `2026-09-19 Ha'azinu|2026-10-10 Bereshit|2026-10-17 Noach|2026-10-24 Lech-Lecha|2026-10-31 Vayera|2026-11-07 Chayei Sara|2026-11-14 Toldot|2026-11-21 Vayetzei|
2026-11-28 Vayishlach|2026-12-05 Vayeshev|2026-12-12 Miketz|2026-12-19 Vayigash|2026-12-26 Vayechi|2027-01-02 Shemot|2027-01-09 Vaera|2027-01-16 Bo|2027-01-23 Beshalach|2027-01-30 Yitro|
2027-02-06 Mishpatim|2027-02-13 Terumah|2027-02-20 Tetzaveh|2027-02-27 Ki Tisa|2027-03-06 Vayakhel|2027-03-13 Pekudei|2027-03-20 Vayikra|2027-03-27 Tzav|2027-04-03 Shmini|2027-04-10 Tazria|
2027-04-17 Metzora|2027-05-01 Achrei Mot|2027-05-08 Kedoshim|2027-05-15 Emor|2027-05-22 Behar|2027-05-29 Bechukotai|2027-06-05 Bamidbar|2027-06-12 Nasso|2027-06-19 Beha'alotcha|
2027-06-26 Sh'lach|2027-07-03 Korach|2027-07-10 Chukat|2027-07-17 Balak|2027-07-24 Pinchas|2027-07-31 Matot-Masei|2027-08-07 Devarim|2027-08-14 Vaetchanan|2027-08-21 Eikev|
2027-08-28 Re'eh|2027-09-04 Shoftim|2027-09-11 Ki Teitzei|2027-09-18 Ki Tavo|2027-09-25 Nitzavim-Vayeilech`
  .split('|')
  .map((s) => s.trim())

describe('torahReadings', () => {
  it('reads 5787 in Israel Shabbat by Shabbat as Hebcal publishes', () => {
    expect(read(year('2026-11-08'), 'israel').map((r) => `${r.date} ${portionsName(r.portions)}`)).toEqual(ISRAEL_5787)
  })

  it('reads the diaspora a week behind after its second day of Shavuot, until Chukat-Balak', () => {
    const diaspora = new Map(read(year('2026-11-08'), 'diaspora').map((r) => [r.date, portionsName(r.portions)]))
    expect(diaspora.has('2027-06-12')).toBe(false)
    expect(['2027-06-19', '2027-07-10', '2027-07-17', '2027-07-24'].map((d) => diaspora.get(d))).toEqual(['Nasso', 'Korach', 'Chukat-Balak', 'Pinchas'])
  })

  it.each([
    ['5786', '2026-01-01', 'israel', ['2026-03-14 Vayakhel-Pekudei', '2026-04-18 Tazria-Metzora', '2026-04-25 Achrei Mot-Kedoshim', '2026-05-09 Behar-Bechukotai', '2026-07-11 Matot-Masei', '2026-09-05 Nitzavim-Vayeilech']],
    ['5786', '2026-01-01', 'diaspora', ['2026-03-14 Vayakhel-Pekudei', '2026-04-18 Tazria-Metzora', '2026-04-25 Achrei Mot-Kedoshim', '2026-05-09 Behar-Bechukotai', '2026-06-27 Chukat-Balak', '2026-07-11 Matot-Masei', '2026-09-05 Nitzavim-Vayeilech']],
    ['5787', '2026-11-08', 'israel', ['2027-07-31 Matot-Masei', '2027-09-25 Nitzavim-Vayeilech']],
    ['5788', '2028-01-01', 'israel', ['2028-03-25 Vayakhel-Pekudei', '2028-04-29 Tazria-Metzora', '2028-05-06 Achrei Mot-Kedoshim', '2028-05-20 Behar-Bechukotai', '2028-07-22 Matot-Masei', '2028-09-16 Nitzavim-Vayeilech']],
    ['5788', '2028-01-01', 'diaspora', ['2028-03-25 Vayakhel-Pekudei', '2028-04-29 Tazria-Metzora', '2028-05-06 Achrei Mot-Kedoshim', '2028-05-20 Behar-Bechukotai', '2028-07-22 Matot-Masei', '2028-09-16 Nitzavim-Vayeilech']],
  ] as const)('%s (%s, %s) joins the pairs Hebcal joins', (_y, day, reckoning, pairs) => {
    expect(joined(year(day), reckoning)).toEqual(pairs)
  })

  it('gives a festival Shabbat its festival in place of a portion', () => {
    const pesach = (torahReadings(year('2026-11-08'), 'israel') ?? []).find((r) => r.date === '2027-04-24')
    expect([pesach?.portions, pesach?.festival?.holiday.id]).toEqual([[], 'pesach'])
  })
})

describe('the cycle', () => {
  it('names the week of the day under test Toldot', () => {
    expect(weekReading('2026-11-08').map((r) => [r.date, r.portion])).toEqual([['2026-11-14', 6]])
  })

  it('closes on Simchat Torah with Vezot HaBerakhah', () => {
    const cycle = torahCycle('2026-11-08') ?? []
    expect(cycle[0]).toEqual({ portion: 1, date: '2026-10-10' })
    expect(cycle[cycle.length - 1]).toEqual({ portion: 54, date: '2027-10-23' })
    expect(new Set(cycle.map((r) => r.portion)).size).toBe(54)
  })
})

describe('namedShabbatot', () => {
  it('names the Shabbatot of 5787 as Hebcal does', () => {
    const named = new Map(namedShabbatot(year('2026-11-08')).filter((s) => s.id !== 'mevarchim').map((s) => [s.id, s.date]))
    expect(Object.fromEntries(named)).toEqual({
      shuva: '2026-09-19', shirah: '2027-01-23', shekalim: '2027-03-06', zachor: '2027-03-20', parah: '2027-03-27',
      hachodesh: '2027-04-03', hagadol: '2027-04-17', chazon: '2027-08-07', nachamu: '2027-08-14',
    })
  })

  it('blesses Kislev on the Shabbat before its Rosh Chodesh', () => {
    const kislev = namedShabbatot(year('2026-11-08')).find((s) => s.blesses?.month.id === 'kislev')
    expect(kislev?.date).toBe('2026-11-07')
  })
})
