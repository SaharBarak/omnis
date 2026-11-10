import { describe, expect, it } from 'vitest'
import { RASHIS, drekkanaAt, navamsaAt, rashiAt } from './rashis'

/**
 * The rashis as Brihat Parashara Hora Shastra sets them: their names and
 * lords (ch. 4), the drekkanas of a rashi belonging to it, its fifth and its
 * ninth (6.8), and the navamsas counted from the rashi in the movable, from
 * its ninth in the fixed and from its fifth in the dual (6.9–10): Mesha's
 * first navamsa is Mesha's, Vrishabha's is Makara's, Mithuna's is Tula's.
 */
describe('RASHIS', () => {
  it('names the twelve from Mesha, each with its lord', () => {
    expect(RASHIS.map((r) => r.name)).toEqual(['Mesha', 'Vrishabha', 'Mithuna', 'Karka', 'Simha', 'Kanya', 'Tula', 'Vrishchika', 'Dhanu', 'Makara', 'Kumbha', 'Meena'])
    expect(RASHIS.map((r) => r.lord)).toEqual(['mars', 'venus', 'mercury', 'moon', 'sun', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'saturn', 'jupiter'])
    expect(rashiAt(201.7)).toMatchObject({ name: 'Tula', devanagari: 'तुला' })
  })

  it('gives a rashi its drekkanas from itself, its fifth and its ninth', () => {
    expect([5, 15, 25].map((l) => drekkanaAt(l).of.name)).toEqual(['Mesha', 'Simha', 'Dhanu'])
    expect(drekkanaAt(201.7)).toMatchObject({ drekkana: 3, lord: 'mercury', of: { name: 'Mithuna' } })
  })

  it('counts the navamsas from the movable rashi itself, the fixed one’s ninth and the dual one’s fifth', () => {
    expect([0, 30, 60].map((l) => navamsaAt(l + 1).name)).toEqual(['Mesha', 'Makara', 'Tula'])
    expect(navamsaAt(201.7).name).toBe('Mesha')
    expect(navamsaAt(359).name).toBe('Meena')
  })
})
