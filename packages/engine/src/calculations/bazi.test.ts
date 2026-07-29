import { describe, it, expect } from 'vitest'

import {
  baziYear,
  yearPillar,
  monthPillar,
  dayPillar,
  hourPillar,
  baziChart,
  luckPillars,
  annualPillar,
  baziBranchCompatibility,
} from './bazi'

describe('dayPillar (sexagenary day, JDN arithmetic)', () => {
  it('reproduces the jiǎzǐ anchor: 27 Jan 2019', () => {
    const d = dayPillar('2019-01-27')
    expect(d.stemName).toBe('Jia')
    expect(d.branchName).toBe('Zi')
  })

  it('reproduces the ytliu0 worked example: 13 Mar 1781 = Ren Xu', () => {
    const d = dayPillar('1781-03-13')
    expect(d.stemName).toBe('Ren')
    expect(d.branchName).toBe('Xu')
  })

  it('advances one position per day', () => {
    const a = dayPillar('2019-01-27')
    const b = dayPillar('2019-01-28')
    expect(b.stem).toBe((a.stem + 1) % 10)
    expect(b.branch).toBe((a.branch + 1) % 12)
  })
})

describe('yearPillar (solar year at Li Chun)', () => {
  it('2026 after Li Chun is Bing Wu — Yang Fire Horse', () => {
    const y = yearPillar('2026-07-29')
    expect(y.name).toBe('Bing Wu — Yang Fire Horse')
  })

  it('January belongs to the previous solar year', () => {
    expect(baziYear('2026-01-15')).toBe(2025)
    expect(yearPillar('2026-01-15').animal).toBe('Snake')
  })

  it('February splits at Li Chun (~4 Feb)', () => {
    expect(baziYear('2026-02-01')).toBe(2025)
    expect(baziYear('2026-02-10')).toBe(2026)
  })
})

describe('monthPillar (Five Tigers rule)', () => {
  it('late July 2026 is the Yi Wei month (Goat month of a Bing year)', () => {
    const m = monthPillar('2026-07-29')
    expect(m.stemName).toBe('Yi')
    expect(m.branchName).toBe('Wei')
  })

  it('a Bing year opens with the Geng Yin Tiger month', () => {
    const m = monthPillar('2026-02-10')
    expect(m.stemName).toBe('Geng')
    expect(m.branchName).toBe('Yin')
  })
})

describe('hourPillar (Five Rats rule)', () => {
  it('the Zi hour of a Jia day is Jia Zi', () => {
    const h = hourPillar('2019-01-27', '23:30')
    expect(h.stemName).toBe('Jia')
    expect(h.branchName).toBe('Zi')
  })

  it('noon is the Wu hour', () => {
    expect(hourPillar('2019-01-27', '12:00').branchName).toBe('Wu')
  })
})

describe('baziChart', () => {
  it('assembles four pillars and counts eight elements', () => {
    const chart = baziChart('2026-07-29', '12:00')
    expect(chart.hour).not.toBeNull()
    const total = Object.values(chart.elementCounts).reduce((a, b) => a + b, 0)
    expect(total).toBe(8)
    expect(chart.dayMaster.name).toBe(chart.day.stemName)
  })

  it('omits the hour pillar without a birth time', () => {
    const chart = baziChart('2026-07-29', null)
    expect(chart.hour).toBeNull()
    const total = Object.values(chart.elementCounts).reduce((a, b) => a + b, 0)
    expect(total).toBe(6)
  })
})

describe('luckPillars', () => {
  it('yields eight consecutive decades', () => {
    const pillars = luckPillars('2026-07-29', 'male')
    expect(pillars.length).toBe(8)
    for (let i = 1; i < pillars.length; i++) {
      expect(pillars[i].startAge).toBe(pillars[i - 1].startAge + 10)
    }
  })

  it('reverses direction with gender in the same year polarity', () => {
    const male = luckPillars('2026-07-29', 'male')[0]
    const female = luckPillars('2026-07-29', 'female')[0]
    // 2026 is yang — male runs forward from the month pillar, female backward.
    expect(male.name).not.toBe(female.name)
  })
})

describe('annualPillar', () => {
  it('matches the year pillar for a mid-year date', () => {
    expect(annualPillar(2026).name).toBe(yearPillar('2026-07-29').name)
  })
})

describe('baziBranchCompatibility', () => {
  it('classifies trine, harmony, clash, neutral', () => {
    expect(baziBranchCompatibility(0, 4).relation).toBe('trine')   // Rat-Dragon
    expect(baziBranchCompatibility(0, 1).relation).toBe('harmony') // Rat-Ox
    expect(baziBranchCompatibility(0, 6).relation).toBe('clash')   // Rat-Horse
    expect(baziBranchCompatibility(0, 2).relation).toBe('neutral') // Rat-Tiger
  })
})
