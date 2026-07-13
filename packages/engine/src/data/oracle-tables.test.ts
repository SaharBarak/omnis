import { describe, it, expect } from 'vitest'
import { getAnalog, getAntipode, getOccult } from './oracle-tables'
import type { SealNumber } from '../core/types'

const seals = Array.from({ length: 20 }, (_, i) => (i + 1) as SealNumber)
const color = (s: number) => ['red', 'white', 'blue', 'yellow'][(s - 1) % 4]

describe('the oracle seal relations', () => {
  it('analog: the two seals sum to 19 (mod 20)', () => {
    for (const s of seals) expect((s + getAnalog(s)) % 20).toBe(19 % 20)
  })
  it('analog is an involution with no fixed point', () => {
    for (const s of seals) {
      expect(getAnalog(getAnalog(s))).toBe(s)
      expect(getAnalog(s)).not.toBe(s)
    }
  })
  it('analog swaps red<->white and blue<->yellow', () => {
    const pair: Record<string, string> = { red: 'white', white: 'red', blue: 'yellow', yellow: 'blue' }
    for (const s of seals) expect(color(getAnalog(s))).toBe(pair[color(s)])
  })
  it('antipode swaps red<->blue and white<->yellow', () => {
    const pair: Record<string, string> = { red: 'blue', blue: 'red', white: 'yellow', yellow: 'white' }
    for (const s of seals) expect(color(getAntipode(s))).toBe(pair[color(s)])
  })
  it('occult swaps red<->yellow and white<->blue', () => {
    const pair: Record<string, string> = { red: 'yellow', yellow: 'red', white: 'blue', blue: 'white' }
    for (const s of seals) expect(color(getOccult(s))).toBe(pair[color(s)])
  })
  it('the known anchor: analog of Dragon (1) is Mirror (18)', () => {
    expect(getAnalog(1 as SealNumber)).toBe(18)
    expect(getAnalog(20 as SealNumber)).toBe(19) // Sun <-> Storm
  })
})
