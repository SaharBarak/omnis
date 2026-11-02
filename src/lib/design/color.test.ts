import { describe, expect, it } from 'vitest'
import { contrast, gamutMap, hexToOklch, hueDistance, solveLightness, toHex, toP3 } from './color'

describe('OKLCH conversion', () => {
  it('round-trips sRGB primaries and neutrals through OKLCH', () => {
    for (const hex of ['#ff0000', '#00ff00', '#0000ff', '#ffffff', '#808080', '#0b0d16', '#7d5bc9']) {
      expect(toHex(hexToOklch(hex))).toBe(hex)
    }
  })

  it('matches the published OKLCH of sRGB red', () => {
    const red = hexToOklch('#ff0000')
    expect(red.l).toBeCloseTo(0.628, 3)
    expect(red.c).toBeCloseTo(0.2577, 3)
    expect(red.h).toBeCloseTo(29.23, 1)
  })

  it('gamut-maps a colour sRGB cannot show while P3 keeps more of it', () => {
    const vivid = { l: 0.85, c: 0.3, h: 135 }
    const srgb = gamutMap(vivid, 'srgb')
    const p3 = gamutMap(vivid, 'p3')
    for (const x of [...srgb, ...p3]) {
      expect(x).toBeGreaterThanOrEqual(0)
      expect(x).toBeLessThanOrEqual(1)
    }
    expect(toP3(vivid)).toMatch(/^color\(display-p3 [\d.]+ [\d.]+ [\d.]+\)$/)
    const back = hexToOklch(toHex(vivid))
    expect(back.c).toBeLessThan(vivid.c)
    expect(hueDistance(back.h, vivid.h)).toBeLessThan(3)
  })
})

describe('contrast', () => {
  it('gives 21 for black on white and 1 for a colour on itself', () => {
    expect(contrast(hexToOklch('#000000'), hexToOklch('#ffffff'))).toBeCloseTo(21, 5)
    expect(contrast(hexToOklch('#7d5bc9'), hexToOklch('#7d5bc9'))).toBeCloseTo(1, 5)
  })

  it('solves the lightness that reaches a target ratio, and no further', () => {
    const ground = { l: 0.16, c: 0.02, h: 250 }
    const solved = solveLightness({ l: 0.3, c: 0.12, h: 30 }, [ground], 4.5, 1)
    expect(contrast(solved, ground)).toBeGreaterThanOrEqual(4.5)
    expect(contrast({ ...solved, l: solved.l - 0.01 }, ground)).toBeLessThan(4.5)
  })

  it('keeps a colour that already passes', () => {
    const color = { l: 0.9, c: 0.1, h: 90 }
    expect(solveLightness(color, [{ l: 0.16, c: 0, h: 0 }], 4.5, 1)).toEqual(color)
  })
})

describe('hueDistance', () => {
  it('wraps around the wheel', () => {
    expect(hueDistance(350, 10)).toBe(20)
    expect(hueDistance(90, 270)).toBe(180)
  })
})
