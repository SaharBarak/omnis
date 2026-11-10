import { describe, expect, it } from 'vitest'
import { shiftDay } from '@pleiad/engine/calculations/day-search'
import { expectBoardRules } from './board-rules'
import { kinBoard } from './kin'
import type { CalendarView } from './types'

/**
 * The kin's board for 21 December 2012, 13.0.0.0.0, read off the Dreamspell's
 * published sources: kin 207, Blue Crystal Hand, day 12 of the Yellow
 * Warrior wavespell in the Yellow Southern Castle of Giving; its oracle the
 * Blue Crystal Storm (guide, kin 259), the Yellow Crystal Human (analog,
 * kin 12), the Red Crystal Earth (antipode, kin 77) and the White Lunar
 * Wizard (occult, kin 54); the Hand of the Core earth family and the Blood
 * clan; Rhythmic Lizard Moon 9, Seli, the root.
 */
const DAY = '2012-12-21'
const board = kinBoard(DAY)
const view = (id: string): CalendarView | undefined => board.views?.find((v) => v.id === id)
const cells = (id: string) => (view(id)?.sections ?? []).flatMap((s) => s.cells)
const facts = Object.fromEntries(board.facts.map((f) => [f.label, f.value]))

describe('kinBoard', () => {
  it('names the kin as the Dreamspell does, its affirmation as its meaning', () => {
    expect(board.label).toBe('Kin 207')
    expect(board.value).toBe('Blue Crystal Hand')
    expect(board.mast?.numeral.text).toBe('207')
    expect(board.meaning).toBe(
      'I dedicate in order to know, universalizing healing. I seal the output of accomplishment with the crystal tone of cooperation. I am guided by the power of self-generation.',
    )
  })

  it('reads its facts off the Dreamspell tables', () => {
    expect(facts).toMatchObject({
      Wavespell: 'Yellow Warrior Wavespell, day 12 of 13',
      'Earth family': 'Core: the heart, the middle finger',
      Clan: 'Blood, the red clan',
      Pulsar: 'Mind, the third dimension',
      Harmonic: '52 of 65',
      '13 Moon': 'Rhythmic Moon · day 9 · Seli',
      Plasma: 'Seli, held in the root',
    })
    expect(facts.Castle).toMatch(/^Yellow Southern Castle of Giving/)
  })

  it('lays its wavespell from the Yellow Warrior, tone by tone, each kin on its civil day', () => {
    expect(cells('wavespell').map((c) => c.key)).toEqual(Array.from({ length: 13 }, (_, i) => String(196 + i)))
    expect(cells('wavespell').find((c) => c.state === 'today')?.key).toBe('207')
    expect(cells('wavespell')[0]?.said).toContain('Kin 196, Yellow Magnetic Warrior')
    expect(cells('wavespell')[0]?.said).toContain('Mon 10 Dec')
  })

  it('sets the Tzolk’in as the harmonic module: thirteen columns of twenty, the fifty-two portals marked', () => {
    const harmonic = view('tzolkin')
    expect(harmonic?.sections[0]?.places?.['207']).toEqual([6, 10])
    expect(harmonic?.sections[0]?.rowHeads).toHaveLength(20)
    expect(cells('tzolkin').filter((c) => c.events?.some((e) => e.key === 'portal'))).toHaveLength(52)
    expect(cells('tzolkin').filter((c) => c.keys?.includes('mystic')).map((c) => Number(c.key))).toEqual(Array.from({ length: 20 }, (_, i) => 121 + i))
  })

  it('draws the oracle as its cross: guide above, antipode and analog beside, occult below', () => {
    const oracle = view('oracle')
    expect(oracle?.layout).toBe('cross')
    expect(Object.fromEntries(cells('oracle').map((c) => [c.key, c.label?.text]))).toEqual({ guide: '259', antipode: '77', destiny: '207', analog: '12', occult: '54' })
    expect(oracle?.sections[0]?.places).toMatchObject({ guide: [0, 1], antipode: [1, 0], destiny: [1, 1], analog: [1, 2], occult: [2, 1] })
  })

  it('lays the 13-Moon month in its four heptads under the seven plasmas', () => {
    const moon = view('moon')
    expect(moon?.name).toBe('The Rhythmic Moon, of the Lizard')
    expect(moon?.sections[0]?.heads?.map((h) => h.text)).toEqual(['Dali', 'Seli', 'Gamma', 'Kali', 'Alpha', 'Limi', 'Silio'])
    expect(moon?.sections[0]?.rowHeads?.map((h) => h.tint)).toEqual(['red', 'white', 'blue', 'yellow'])
    expect(cells('moon').find((c) => c.state === 'today')?.label?.text).toBe('9')
  })

  it('lists what comes next, each on its kin where it falls in this spin', () => {
    expect(board.next.slice(0, 3).map(({ name, date, at }) => [name, date, at?.cell])).toEqual([
      ['The Red Moon Wavespell begins', '2012-12-23', '209'],
      ['The Green Central Castle of Enchantment begins', '2012-12-23', '209'],
      ['Kin 210, a galactic activation portal', '2012-12-24', '210'],
    ])
  })

  it('keeps the board rules', () => {
    expectBoardRules(board, 'kin', shiftDay, DAY)
  })

  it('keeps 0.0 Hunab Ku outside the count: 29 February reads as the 28th, and the month view steps aside', () => {
    const leap = kinBoard('2024-02-29')
    expect(leap.label).toBe(kinBoard('2024-02-28').label)
    expect(leap.views?.map((v) => v.id)).toEqual(['wavespell', 'tzolkin', 'oracle'])
  })
})
