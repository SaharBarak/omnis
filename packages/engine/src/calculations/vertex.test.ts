import { describe, it, expect } from 'vitest'
import { calculateNatalChart, VERTEX_LATITUDE_LIMIT  } from './astrology'

/**
 * The Vertex is the ecliptic point crossing the PRIME VERTICAL in the west.
 * Its defining invariant is therefore azimuth = due west — NOT "it lands in
 * houses 5-8", which is only a mid-northern-latitude rule of thumb and fails in
 * the southern hemisphere (there the point sits west of the Descendant but can
 * land in house 9). We assert the definition, not the folklore.
 */
const DEG = Math.PI / 180
const norm360 = (d: number) => ((d % 360) + 360) % 360

const CASES = [
  { date: '1970-01-28', time: '16:31', latitude: -9.45, longitude: -12.16 },
  { date: '1991-08-21', time: '23:16', latitude: 48.63, longitude: 53.99 },
  { date: '2000-03-05', time: '03:17', latitude: 44.79, longitude: 4.27 },
  { date: '1960-11-02', time: '21:05', latitude: -33.87, longitude: 151.2 },
  { date: '1991-03-14', time: '08:20', latitude: 32.08, longitude: 34.78 },
]

describe('the Vertex', () => {
  it('lies due west on the prime vertical, in both hemispheres', () => {
    const eps = 23.44 * DEG
    for (const c of CASES) {
      const chart = calculateNatalChart(c)
      const v = chart.vertex?.longitude
      expect(v, `vertex for lat ${c.latitude}`).toBeDefined()

      const lambda = norm360(v!) * DEG
      const phi = c.latitude * DEG
      const ra = Math.atan2(Math.sin(lambda) * Math.cos(eps), Math.cos(lambda))
      const dec = Math.asin(Math.sin(eps) * Math.sin(lambda))

      const mcLambda = norm360(chart.midheaven!.longitude) * DEG
      const ramc = Math.atan2(Math.sin(mcLambda) * Math.cos(eps), Math.cos(mcLambda))
      const h = ramc - ra

      // cos(alt)*cos(azimuth) == 0  =>  the point is due east or due west.
      const residual =
        Math.sin(dec) * Math.cos(phi) - Math.cos(dec) * Math.sin(phi) * Math.cos(h)
      expect(Math.abs(residual), `on prime vertical, lat ${c.latitude}`).toBeLessThan(0.02)

      // cos(alt)*sin(azimuth) < 0  =>  WEST, not east (that would be the Antivertex).
      expect(-Math.cos(dec) * Math.sin(h), `due west, lat ${c.latitude}`).toBeLessThan(0)
    }
  })

  it('refuses to guess near the poles rather than returning a wrong number', () => {
    const polar = calculateNatalChart({
      date: '1990-06-21', time: '12:00', latitude: VERTEX_LATITUDE_LIMIT + 5, longitude: 20,
    })
    expect(polar.vertex).toBeNull()
  })
})
