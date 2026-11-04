import { getZodiacSignFromLongitude } from '@pleiad/engine/data/zodiac-signs'
import type { SkyBody } from './types'

/** A longitude as sign and whole degree, e.g. `Leo 12°`. */
export const placeAt = (longitude: number): string =>
  `${getZodiacSignFromLongitude(longitude).name} ${Math.floor((((longitude % 360) + 360) % 360) % 30)}°`

/** Without a birth time, the stretch of sky a body covers that day; null when it is known to the degree. */
const dayArc = (b: SkyBody): readonly [number, number] | null => (b.arc && Math.abs(b.arc[1] - b.arc[0]) >= 1 ? b.arc : null)

/** A body's place in words: sign and degree, the day's arc without a birth time, and retrograde. */
export const bodyValue = (b: SkyBody): string => {
  const arc = dayArc(b)
  const place = arc ? `${placeAt(arc[0])} to ${placeAt(arc[1])}` : placeAt(b.longitude)
  return b.retrograde ? `${place}, retrograde` : place
}

/** The signs a body may be in: one, or both ends of its day's arc when that arc crosses into the next sign. */
export const signsOf = (b: SkyBody): readonly string[] => {
  const arc = dayArc(b)
  if (!arc) return [b.sign.name]
  const ends = arc.map((longitude) => getZodiacSignFromLongitude(longitude).name)
  return [...new Set(ends)]
}
