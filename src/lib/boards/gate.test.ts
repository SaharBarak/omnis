import { describe, expect, it } from 'vitest'
import { shiftDay } from '@pleiad/engine/calculations/day-search'
import { expectBoardRules } from './board-rules'
import { degreeWords, gateBoard } from './gate'
import { skyOf } from './sky'

/**
 * The gate's board across the days a Rave year turns on (BENTO_BOARDS.md
 * "Systems"): Rave New Year (the Sun into gate 41, 22 January 2026), the
 * March equinox, the start of the Quarter of Mutation (gate 1, 5 November
 * 2026), and the days the Sun and the Earth stand at the two ends of one
 * channel, 43-23 and 34-20, when each is the other's harmonic.
 */
const DAYS = ['2026-01-22', '2026-03-20', '2026-11-05', '2026-11-08', '2026-11-13', '2026-11-25', '2027-01-21']

describe('gateBoard', () => {
  it.each(DAYS)('keeps the board rules on %s, today once in every view', (day) => {
    expectBoardRules(gateBoard(day, skyOf(day)), `gate ${day}`, shiftDay, day)
  })

  it('names the channel the Sun and the Earth complete between them, and lists no gate as its own harmonic', () => {
    const board = gateBoard('2026-11-13', skyOf('2026-11-13'))
    const facts = Object.fromEntries(board.facts.map((f) => [f.label, f.value]))
    expect(facts.Sun).toMatch(/^Gate 43,/)
    expect(facts['Sun and Earth']).toMatch(/^Channel 43-23,/)
    const harmonics = board.views?.find((v) => v.id === 'lines')?.sections[1]?.cells.map((c) => c.key) ?? []
    expect(harmonics).not.toContain('43')
    expect(harmonics).not.toContain('23')
  })

  /** The published Rave Mandala degree table: gate 41 opens at 2° Aquarius, 19 at 7°37′30″, 13 at 13°15′, 49 at 18°52′30″. */
  it('says where each gate opens to the arcsecond', () => {
    const wheel = gateBoard('2026-11-08', skyOf('2026-11-08')).views?.find((v) => v.id === 'wheel')
    const opens = (gate: string) => wheel?.sections.flatMap((s) => s.cells).find((c) => c.key === gate)?.said.split(' · ').find((p) => p.startsWith('from '))
    expect(['41', '19', '13', '49'].map(opens)).toEqual(['from 2° Aquarius', 'from 7°37′30″ Aquarius', 'from 13°15′ Aquarius', 'from 18°52′30″ Aquarius'])
  })
})

describe('degreeWords', () => {
  it.each([
    [2, '2°'],
    [13.25, '13°15′'],
    [18.875, '18°52′30″'],
    [3.875, '3°52′30″'],
    [0.0052083333, '0°00′19″'],
    [7.6249999999, '7°37′30″'],
  ])('writes %f° as %s', (degrees, words) => {
    expect(degreeWords(degrees)).toBe(words)
  })
})
