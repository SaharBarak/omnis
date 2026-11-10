import { describe, expect, it } from 'vitest'
import { STATION_DAYS, eightNineteenOf, isStation } from './eight-nineteen'
import { haabOfDays } from './long-count'
import { tzolkinOfDays } from './tzolkin'

/** Days from the era base of a Long Count read in the era before it, as Palenque's mythological dates are (13.0.0.0.0 being the base). */
const before = (places: readonly number[]): number => {
  const [baktun = 0, katun = 0, tun = 0, winal = 0, kin = 0] = places
  return baktun * 144000 + katun * 7200 + tun * 360 + winal * 20 + kin - 13 * 144000
}
const round = (days: number): string => {
  const t = tzolkinOfDays(days)
  const h = haabOfDays(days)
  return `${t.tone} ${t.daySign.yucatec} ${h.day} ${h.monthName}`
}

/** MacLeod and Kinsman, "Xultun Number A and the 819-Day Count" (Maya Decipherment, 2012), after Thompson. */
describe('the 819-day count', () => {
  it("has its base station on 12.19.19.17.17 1 Kab'an 5 Kumk'u, three days before 4 Ajaw 8 Kumk'u", () => {
    const base = before([12, 19, 19, 17, 17])
    expect(base).toBe(-3)
    expect(isStation(base)).toBe(true)
    expect(round(base)).toBe("1 Kab'an 5 Kumk'u")
    expect(round(0)).toBe("4 Ajaw 8 Kumk'u")
  })

  it("keeps the Palenque Temple XIX bench's station, 12.9.19.14.5 1 Chikchan 18 Ch'en", () => {
    const station = before([12, 9, 19, 14, 5])
    expect(isStation(station)).toBe(true)
    expect(round(station)).toBe("1 Chikchan 18 Ch'en")
  })

  it('falls every 819 days, each station a day numbered 1', () => {
    const at = eightNineteenOf(1877070)
    expect(at.next - at.station).toBe(STATION_DAYS)
    expect(at.station + at.day).toBe(1877070)
    for (let station = at.station - STATION_DAYS * 40; station <= at.next; station += STATION_DAYS) expect(tzolkinOfDays(station).tone).toBe(1)
  })
})
