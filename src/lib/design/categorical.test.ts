import { describe, expect, it } from 'vitest'
import { CATEGORICAL_GATES as GATES, emitted, solveCategorical, type CategoricalProblem } from './categorical'
import { contrast, type Oklch } from './color'
import { apart, apartDichromat, seen } from './color-vision'

const ground: Oklch = { l: 0.155, c: 0.024, h: 244 }
const ink: Oklch = { l: 0.965, c: 0.012, h: 244 }

const problem = (hues: readonly number[]): CategoricalProblem<string> => ({
  slots: hues.map((hue, i) => ({ key: `s${i}`, hue })),
  chroma: 0.13,
  band: [0.48, 0.67],
  surfaces: [ground, { ...ground, l: 0.275 }],
  labels: [ground, ink],
  roles: [],
})

describe('solveCategorical', () => {
  it('snaps each slot to the grid and returns a set that clears every gate', () => {
    const tones = solveCategorical(problem([84, 12, 264, 192]))
    const colours = Object.values(tones).map((l, i) => emitted({ l, c: 0.13, h: [84, 12, 264, 192][i] }))
    for (const l of Object.values(tones)) expect(Math.round((l - 0.48) / GATES.step) * GATES.step + 0.48).toBeCloseTo(l, 9)
    for (const colour of colours) expect(contrast(colour, { ...ground, l: 0.275 })).toBeGreaterThanOrEqual(GATES.mark)
    for (const [i, a] of colours.entries()) {
      for (const b of colours.slice(i + 1)) {
        expect(apart(seen(a), seen(b), 'normal')).toBeGreaterThanOrEqual(GATES.normal)
        expect(apartDichromat(seen(a), seen(b))).toBeGreaterThanOrEqual(GATES.dichromat)
      }
    }
  })

  it('is deterministic', () => {
    expect(solveCategorical(problem([84, 12, 264, 192]))).toEqual(solveCategorical(problem([84, 12, 264, 192])))
  })

  it('fails loudly when no set can pass', () => {
    expect(() => solveCategorical(problem([84, 86, 88]))).toThrow(/categorical gates/)
  })
})
