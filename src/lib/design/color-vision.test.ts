import { describe, expect, it } from 'vitest'
import { hexToOklch } from './color'
import { VISIONS, apart, apartDichromat, seen } from './color-vision'

const at = (hex: string) => seen(hexToOklch(hex))

describe('colour vision', () => {
  it('sees a colour as itself, zero apart, in every vision', () => {
    const teal = at('#00a8a4')
    for (const vision of VISIONS) expect(apart(teal, teal, vision)).toBe(0)
  })

  it('agrees with the data-visualisation validator, which uses the same model', () => {
    // validate_palette.js on #b78a16,#c05b6b,#587dce,#00a8a4 (dark): the worst
    // protan/deutan pair is teal and coral at ΔE 8.5 (deutan), and the worst
    // normal pair is teal and blue at 15.8.
    expect(apart(at('#00a8a4'), at('#c05b6b'), 'deutan')).toBeCloseTo(0.085, 2)
    expect(apart(at('#00a8a4'), at('#587dce'), 'normal')).toBeCloseTo(0.158, 2)
  })

  it('collapses the red-green pair a deutan cannot tell apart', () => {
    const red = at('#d03030')
    const green = at('#6a8a00')
    expect(apart(red, green, 'normal')).toBeGreaterThan(0.2)
    expect(apartDichromat(red, green)).toBeLessThan(apart(red, green, 'normal') / 2)
  })
})
