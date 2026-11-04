import { describe, expect, it } from 'vitest'
import { spelled, Spelled } from './number-words'

describe('spelled', () => {
  it('spells small counts and opens a sentence with a capital', () => {
    expect(spelled(5)).toBe('five')
    expect(Spelled(5)).toBe('Five')
  })

  it('writes counts past twelve in figures', () => {
    expect(spelled(13)).toBe('13')
    expect(Spelled(13)).toBe('13')
  })
})
