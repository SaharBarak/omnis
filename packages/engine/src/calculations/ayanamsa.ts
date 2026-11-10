/**
 * The ayanamsa: how far the sidereal zodiac stands behind the tropical, the
 * precession since the two coincided. One reckoning for every sidereal
 * reading the engine makes (the sidereal Sun, the Panchang, the sky's dates
 * and instants), so none imports another's calendar to find it.
 */

/** The ayanamsa the sidereal values are reckoned by. */
export const SIDEREAL_AYANAMSA = 'Lahiri'

/** Lahiri ayanamsa, linear approximation: 23.85° at J2000 + 50.29″/yr. */
export function lahiriAyanamsa(dateStr: string): number {
  const year = new Date(`${dateStr}T12:00:00Z`).getUTCFullYear()
  return 23.85 + (year - 2000) * (50.29 / 3600)
}
