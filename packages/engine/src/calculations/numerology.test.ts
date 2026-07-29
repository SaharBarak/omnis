import { describe, it, expect } from 'vitest'

import {
  reduceNumber,
  lifePathNumber,
  birthdayNumber,
  expressionNumber,
  soulUrgeNumber,
  personalityNumber,
  maturityNumber,
  pinnacles,
  challenges,
  personalYearNumber,
  personalMonthNumber,
  personalDayNumber,
  numerologyCompatibility,
  numerologyChart,
} from './numerology'

describe('reduceNumber', () => {
  it('reduces to a single digit', () => {
    expect(reduceNumber(1990)).toBe(1)
    expect(reduceNumber(45)).toBe(9)
  })

  it('preserves masters when asked, reduces them when not', () => {
    expect(reduceNumber(29)).toBe(11)
    expect(reduceNumber(29, false)).toBe(2)
    expect(reduceNumber(22)).toBe(22)
    expect(reduceNumber(22, false)).toBe(4)
  })
})

describe('birth-date numbers', () => {
  it('computes a master Life Path (16 Aug 1987 → 22)', () => {
    // 8 + (16→7) + (1987→25→7) = 22, kept as master.
    expect(lifePathNumber('1987-08-16')).toBe(22)
  })

  it('keeps the day component master (29 July 1990 → 7+11+1 → 1)', () => {
    expect(lifePathNumber('1990-07-29')).toBe(1)
  })

  it('birthday number keeps masters (29 → 11)', () => {
    expect(birthdayNumber('1990-07-29')).toBe(11)
    expect(birthdayNumber('1990-07-04')).toBe(4)
  })
})

describe('name numbers', () => {
  it('John Smith: expression 8, soul urge 6, personality 11', () => {
    expect(expressionNumber('John Smith')).toBe(8)
    expect(soulUrgeNumber('John Smith')).toBe(6)
    expect(personalityNumber('John Smith')).toBe(11)
  })

  it('treats Y as a vowel only in vowelless words (Lynn)', () => {
    expect(soulUrgeNumber('Lynn')).toBe(7)
    expect(personalityNumber('Lynn')).toBe(4)
  })

  it('returns null for names with no Latin letters', () => {
    expect(expressionNumber('לילך כהן')).toBeNull()
    expect(soulUrgeNumber('לילך')).toBeNull()
    expect(maturityNumber('1990-07-29', 'לילך')).toBeNull()
  })

  it('maturity = life path + expression, reduced', () => {
    // 22 + 8 = 30 → 3
    expect(maturityNumber('1987-08-16', 'John Smith')).toBe(3)
  })
})

describe('pinnacles and challenges', () => {
  it('derives the four pinnacles with age ranges (16 Aug 1987)', () => {
    // m8 d7 y7 → p1 6, p2 5, p3 11 (master), p4 6; first ends at 36-4=32.
    expect(pinnacles('1987-08-16')).toEqual([
      { number: 6, fromAge: 0, toAge: 32 },
      { number: 5, fromAge: 33, toAge: 41 },
      { number: 11, fromAge: 42, toAge: 50 },
      { number: 6, fromAge: 51, toAge: null },
    ])
  })

  it('derives the four challenges fully reduced (29 July 1990)', () => {
    // m7 d2 y1 → |7-2|=5, |2-1|=1, |5-1|=4, |7-1|=6
    expect(challenges('1990-07-29')).toEqual([5, 1, 4, 6])
  })
})

describe('personal cycles', () => {
  it('personal year from the universal year (29 July 1990 in 2026 → 1)', () => {
    expect(personalYearNumber('1990-07-29', '2026-01-15')).toBe(1)
  })

  it('personal month and day chain off the year', () => {
    const py = personalYearNumber('1990-07-29', '2026-07-29')
    const pm = personalMonthNumber('1990-07-29', '2026-07-29')
    expect(pm).toBe(reduceNumber(py + 7))
    const pd = personalDayNumber('1990-07-29', '2026-07-29')
    expect(pd).toBe(reduceNumber(pm + reduceNumber(29)))
  })
})

describe('compatibility', () => {
  it('same element is a natural match', () => {
    expect(numerologyCompatibility(1, 5).harmony).toBe('natural')
    expect(numerologyCompatibility(3, 9).harmony).toBe('natural')
  })

  it('masters read through their root digit (11 & 22 → 2 & 4 → natural)', () => {
    expect(numerologyCompatibility(11, 22).harmony).toBe('natural')
  })

  it('opposed pairs are challenging, the rest compatible', () => {
    expect(numerologyCompatibility(1, 2).harmony).toBe('challenging')
    expect(numerologyCompatibility(1, 9).harmony).toBe('compatible')
  })
})

describe('numerologyChart', () => {
  it('assembles every number at once', () => {
    const chart = numerologyChart('1987-08-16', 'John Smith', '2026-07-29')
    expect(chart.lifePath).toBe(22)
    expect(chart.expression).toBe(8)
    expect(chart.maturity).toBe(3)
    expect(chart.pinnacles.length).toBe(4)
    expect(chart.challenges.length).toBe(4)
    expect(chart.personalYear).toBeGreaterThanOrEqual(1)
  })
})
