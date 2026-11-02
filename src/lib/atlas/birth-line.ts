import type { AtlasPerson } from './pair'

const DATE = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })

const coord = (v: number, pos: string, neg: string): string => `${Math.abs(v).toFixed(2)}°${v >= 0 ? pos : neg}`

/** "14 March 1991, 08:20, 32.08°N 34.78°E", from the input itself. */
export function birthLine(p: AtlasPerson): string {
  const { date, time, place } = p.input
  const parts = [DATE.format(new Date(`${date}T00:00:00Z`))]
  if (time) parts.push(time)
  if (place) parts.push(place.label ?? `${coord(place.lat, 'N', 'S')} ${coord(place.lng, 'E', 'W')}`)
  return parts.join(', ')
}
