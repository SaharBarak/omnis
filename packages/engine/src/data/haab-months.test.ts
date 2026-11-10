import { describe, expect, it } from 'vitest'
import { HAAB_DAYS, HAAB_MONTH_TABLE } from './haab-months'

describe('HAAB_MONTH_TABLE', () => {
  it("names the months as Wikipedia's Haab' article sets them after Kettunen and Helmke, and as Landa's Yukatek wrote them", () => {
    expect(HAAB_MONTH_TABLE.map((m) => m.name)).toEqual([
      'Pop', "Wo'", 'Sip', "Sotz'", 'Sek', 'Xul', "Yaxk'in", 'Mol', "Ch'en", 'Yax', "Sak'", 'Keh', 'Mak', "K'ank'in", 'Muwan', 'Pax', "K'ayab'", "Kumk'u", "Wayeb'",
    ])
    expect(HAAB_MONTH_TABLE.map((m) => m.yukatek)).toEqual([
      'Pop', 'Uo', 'Zip', "Zotz'", 'Tzec', 'Xul', 'Yaxkin', 'Mol', "Ch'en", 'Yax', 'Zac', 'Ceh', 'Mac', 'Kankin', 'Muan', 'Pax', 'Kayab', 'Cumku', 'Uayeb',
    ])
  })

  it("holds eighteen months of twenty days and Wayeb''s five: 365", () => {
    expect(HAAB_MONTH_TABLE.map((m) => m.days)).toEqual([...Array<number>(18).fill(20), 5])
    expect(HAAB_DAYS).toBe(365)
    expect(HAAB_MONTH_TABLE.every((m, i) => m.index === i)).toBe(true)
  })
})
