/**
 * The 819-day count: stations 819 days apart (7 × 9 × 13), recorded in a
 * few Initial Series and in the Dresden Codex. Its base is the station
 * 12.19.19.17.17 1 Kab'an 5 Kumk'u, the day three days before the era base
 * 4 Ajaw 8 Kumk'u (Thompson, *Maya Hieroglyphic Writing*, 1971, pp. 212–217:
 * "a base in the 819-day cycle"); 819 being thirteen sixty-threes, every
 * station falls on a day numbered 1. The earliest station known is the
 * Palenque Temple XIX bench's 12.9.19.14.5 1 Chikchan 18 Ch'en, in the era
 * before the base. MacLeod and Kinsman, "Xultun Number A and the 819-Day
 * Count", *Maya Decipherment* (11 June 2012,
 * https://mayadecipherment.com/2012/06/11/xultun-number-a-and-the-819-day-count/).
 * Each station also stands in a direction and its colour, four stations
 * round (Berlin and Kelley 1961); the order is not encoded here.
 */

export const STATION_DAYS = 819

/** The count's base station, in days from the era base. */
const BASE = -3

export interface EightNineteen {
  /** Days since the last station, 0 on a station. */
  readonly day: number
  /** The last station on or before the day, and the next after it, in days from the era base. */
  readonly station: number
  readonly next: number
}

/** Where a day `days` after the era base stands in the 819-day count. */
export function eightNineteenOf(days: number): EightNineteen {
  const day = (((days - BASE) % STATION_DAYS) + STATION_DAYS) % STATION_DAYS
  return { day, station: days - day, next: days - day + STATION_DAYS }
}

export const isStation = (days: number): boolean => eightNineteenOf(days).day === 0
