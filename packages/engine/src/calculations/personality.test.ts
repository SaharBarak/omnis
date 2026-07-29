import { describe, it, expect } from 'vitest'

import {
  cognitiveFunctions,
  comparePersonalities,
  isValidEnneagram,
  MBTI_TYPES,
  ENNEAGRAM_TYPES,
  VIA_STRENGTHS,
} from './personality'

describe('cognitiveFunctions', () => {
  it('derives the canonical stacks', () => {
    expect(cognitiveFunctions('INTJ')).toEqual(['Ni', 'Te', 'Fi', 'Se'])
    expect(cognitiveFunctions('ENFP')).toEqual(['Ne', 'Fi', 'Te', 'Si'])
    expect(cognitiveFunctions('ISTJ')).toEqual(['Si', 'Te', 'Fi', 'Ne'])
    expect(cognitiveFunctions('ESFJ')).toEqual(['Fe', 'Si', 'Ne', 'Ti'])
    expect(cognitiveFunctions('ISTP')).toEqual(['Ti', 'Se', 'Ni', 'Fe'])
  })

  it('yields four distinct functions for every type', () => {
    for (const type of MBTI_TYPES) {
      const stack = cognitiveFunctions(type)
      expect(new Set(stack).size).toBe(4)
    }
  })
})

describe('reference data', () => {
  it('carries 9 enneagram types and 24 VIA strengths', () => {
    expect(ENNEAGRAM_TYPES.length).toBe(9)
    expect(Object.values(VIA_STRENGTHS).flat().length).toBe(24)
  })

  it('validates enneagram notation', () => {
    expect(isValidEnneagram('4')).toBe(true)
    expect(isValidEnneagram('4w5')).toBe(true)
    expect(isValidEnneagram('10')).toBe(false)
    expect(isValidEnneagram('4w')).toBe(false)
  })
})

describe('comparePersonalities', () => {
  it('compares only what both profiles carry', () => {
    const lines = comparePersonalities(
      { mbti: 'INTJ', attachment: 'secure' },
      { mbti: 'ENFP', enneagram: '7' }
    )
    expect(lines.length).toBe(1)
    expect(lines[0].framework).toBe('MBTI')
  })

  it('recognizes shared cognitive functions', () => {
    const [line] = comparePersonalities({ mbti: 'INTJ' }, { mbti: 'ENTJ' })
    // INTJ: Ni Te Fi Se · ENTJ: Te Ni Se Fi — all four shared.
    expect(line.note).toContain('4 cognitive functions')
  })

  it('names the anxious-avoidant loop', () => {
    const [line] = comparePersonalities(
      { attachment: 'anxious' },
      { attachment: 'avoidant' }
    )
    expect(line.note).toContain('pursue-withdraw')
  })

  it('flags a large Big Five gap', () => {
    const [line] = comparePersonalities(
      { bigFive: { openness: 90, extraversion: 20 } },
      { bigFive: { openness: 30, extraversion: 25 } }
    )
    expect(line.note).toContain('Openness')
    expect(line.note).toContain('60')
  })

  it('celebrates a shared primary love language', () => {
    const [line] = comparePersonalities(
      { loveLanguages: ['quality time', 'physical touch'] },
      { loveLanguages: ['quality time', 'acts of service'] }
    )
    expect(line.note).toContain('same primary language')
  })
})
