import { getZodiacSignFromLongitude } from '@pleiad/engine/data/zodiac-signs'
import type { SkyBody } from './types'

/** A longitude as sign and whole degree, e.g. `Leo 12°`. */
export const placeAt = (longitude: number): string =>
  `${getZodiacSignFromLongitude(longitude).name} ${Math.floor((((longitude % 360) + 360) % 360) % 30)}°`

/** A body's place in words: sign and degree, the day's arc without a birth time, and retrograde. */
export const bodyValue = (b: SkyBody): string => {
  const place = b.arc && Math.abs(b.arc[1] - b.arc[0]) >= 1 ? `${placeAt(b.arc[0])} to ${placeAt(b.arc[1])}` : placeAt(b.longitude)
  return b.retrograde ? `${place}, retrograde` : place
}
