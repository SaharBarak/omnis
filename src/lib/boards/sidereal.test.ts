/**
 * The sidereal Sun's board on 2026-11-08, the Sun at 21° Tula (Lahiri), and
 * on days that hold its edges: Vrishchika Sankranti (16 November 2026),
 * Makara Sankranti (14 January 2027, 21:14 IST) and Mesha Sankranti
 * (14 April 2027), as Drik Panchang dates them in India. Published: the Sun
 * entered Vishakha on 6 November 2026 (21:03 IST) and enters Anuradha on
 * 20 November at 03:03 IST (Drik Panchang, PanchangBodh); Tula's
 * drekkanas, navamsas and the nakshatras' lords as `rashis.test.ts` and
 * `nakshatras.test.ts` hold them.
 */
import { describe, expect, it } from 'vitest'
import { shiftDay } from '@pleiad/engine/calculations/day-search'
import { expectBoardRules } from './board-rules'
import { siderealBoard } from './sidereal'
import { skyOf } from './sky'
import type { CalendarView, DayBoard } from './types'

const board = (day: string): DayBoard => siderealBoard(day, skyOf(day))
const view = (b: DayBoard, id: string): CalendarView | undefined => b.views?.find((v) => v.id === id)
const cells = (b: DayBoard, id: string) => view(b, id)?.sections.flatMap((s) => s.cells) ?? []
const cell = (b: DayBoard, id: string, key: string) => cells(b, id).find((c) => c.key === key)
const facts = (b: DayBoard) => Object.fromEntries(b.facts.map((f) => [f.label, f.value]))

const DAY = '2026-11-08'
const EDGES = ['2026-11-16', '2026-11-17', '2027-01-14', '2027-01-15', '2027-04-14']

describe('siderealBoard', () => {
  it.each([DAY, ...EDGES])('holds the board rules on %s', (day) => {
    expectBoardRules(board(day), `sidereal ${day}`, shiftDay, day)
  })

  it('reads 21° Tula in Vishakha, its third drekkana Mithuna’s, its navamsa Mesha', () => {
    const b = board(DAY)
    expect([b.value, b.mast?.title, b.mast?.script?.text, b.mast?.words.map((w) => w.text)]).toEqual([
      '21° Libra',
      'Tula',
      'तुला',
      ['Libra', 'ruled by Venus', 'Vishakha, pada 1', 'Lahiri ayanamsa'],
    ])
    expect(facts(b)).toEqual({
      Ayanamsa: 'Lahiri, 24°13′',
      Rashi: 'Tula, तुला',
      Lord: 'Venus',
      Tattva: 'Vayu, air',
      Drekkana: 'III, of Mithuna, ruled by Mercury',
      Navamsa: 'Mesha',
      Nakshatra: 'Vishakha, pada 1',
      Deity: 'Indra and Agni',
      'Nakshatra lord': 'Jupiter',
      Sankranti: 'Sat 17 Oct, 22 days ago',
    })
  })

  it("bands the Sun's month by the nakshatras it crosses, each day under its drekkana", () => {
    const b = board(DAY)
    const month = cells(b, 'month')
    expect([...new Set(month.map((c) => c.band))]).toEqual(['nakshatra-14', 'nakshatra-15', 'nakshatra-16'])
    /* The Sun entered Vishakha on 6 November after noon UTC: the 7th is the first day whose noon finds it there. */
    expect(month.find((c) => c.band === 'nakshatra-16')?.key).toBe('2026-11-07')
    expect(view(b, 'month')?.legend.map((l) => l.words).slice(0, 3)).toEqual([
      'Chitra, of Tvashtr, its lord Mars: 0° to 6°40′',
      'Swati, of Vayu, its lord Rahu: 6°40′ to 20°',
      'Vishakha, of Indra and Agni, its lord Jupiter: 20° to 30°',
    ])
    expect(cell(b, 'month', DAY)?.said).toBe('Sun 8 Nov · Sun at 21° Tula · Vishakha, pada 1 · drekkana III, of Mithuna, ruled by Mercury')
  })

  it('rings the rashis by their Sankrantis and the nakshatras by the days the Sun enters them', () => {
    const b = board(DAY)
    expect(cells(b, 'year')).toHaveLength(12)
    expect(['Vrishchika', 'Makara', 'Mesha'].map((key) => cell(b, 'year', key)?.note)).toEqual(['16 Nov', '14 Jan', '14 Apr'])
    expect(cell(b, 'year', 'Tula')).toMatchObject({ state: 'today', note: '17 Oct', label: { text: 'तुला', lang: 'hi' } })
    expect(cell(b, 'year', 'Makara')?.events?.map((e) => e.key)).toEqual(['festival'])
    expect(cell(b, 'nakshatras', 'nakshatra-16')).toMatchObject({ state: 'today', note: '6 Nov' })
    expect(cell(b, 'nakshatras', 'nakshatra-17')).toMatchObject({ title: 'Anuradha', note: '20 Nov', keys: ['lord-Saturn'] })
  })

  it('names the next nakshatra and the next three Sankrantis, Makara Sankranti among them', () => {
    expect(board(DAY).next.map((e) => [e.name, e.date, e.inDays, e.at?.view, e.at?.cell])).toEqual([
      ['Vrishchika Sankranti', '2026-11-16', 8, 'year', 'Vrishchika'],
      ['Sun enters Anuradha', '2026-11-20', 12, 'nakshatras', 'nakshatra-17'],
      ['Dhanu Sankranti', '2026-12-16', 38, 'year', 'Dhanu'],
      ['Makara Sankranti', '2027-01-14', 67, 'year', 'Makara'],
    ])
  })

  it('opens Makara’s month on Makara Sankranti', () => {
    const b = board('2027-01-15')
    expect(b.mast?.title).toBe('Makara')
    expect(cells(b, 'month')[0]?.events?.map((e) => e.name)).toEqual(['Makara Sankranti, Thu 14 Jan'])
  })
})
