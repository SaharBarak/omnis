import { describe, expect, it } from 'vitest'
import { barDot, rowsOf } from './maya-numeral'

describe('barDot', () => {
  it('writes ones as dots above fives as bars', () => {
    expect(barDot(7)).toEqual({ bars: 1, dots: 2, shell: false })
    expect(barDot(19)).toEqual({ bars: 3, dots: 4, shell: false })
    expect(barDot(10)).toEqual({ bars: 2, dots: 0, shell: false })
  })

  it('writes zero as a shell in one row', () => {
    expect(barDot(0)).toEqual({ bars: 0, dots: 0, shell: true })
    expect(rowsOf(barDot(0))).toBe(1)
  })

  it('stands in one row per bar plus one for the dots', () => {
    expect(rowsOf(barDot(19))).toBe(4)
    expect(rowsOf(barDot(15))).toBe(3)
    expect(rowsOf(barDot(4))).toBe(1)
  })

  it('refuses what one place cannot hold', () => {
    expect(() => barDot(20)).toThrow(RangeError)
    expect(() => barDot(-1)).toThrow(RangeError)
    expect(() => barDot(2.5)).toThrow(RangeError)
  })
})
