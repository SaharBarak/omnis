import {
  calculateNatalChart,
  getCurrentPlanetaryPositions,
  getPlanetaryDayArcs,
} from '@pleiad/engine/calculations/astrology'
import { CELESTIAL_BODIES } from '@pleiad/engine/data/planets'
import type { PlanetPosition } from '@pleiad/engine/types/astrology'
import { signRef } from './place'
import type { BirthInput, SkyBody, SkyLayer } from './types'
import { planetGlyphSrc } from '@/lib/design/glyph-paths'

/** The ten bodies plus the North Node, which synastry ties can name. */
const DRAWN = new Set([...CELESTIAL_BODIES.map((p) => p.id), 'northNode'])

const toBody = (p: PlanetPosition, arc: readonly [number, number] | null): SkyBody => ({
  id: p.planet.id,
  name: p.planet.name,
  symbol: p.planet.symbol,
  src: planetGlyphSrc(p.planet.id),
  longitude: p.position.longitude,
  arc,
  sign: signRef(p.position.sign),
  degree: p.position.degree,
  retrograde: p.retrograde,
})

/**
 * Natal sky. With time and place: the exact chart and its ascendant. With a
 * date alone: the engine's noon positions, each body carrying the arc it
 * covers that day, so the drawing never claims more than the input knows.
 */
export function buildSky(input: BirthInput): SkyLayer {
  if (input.time && input.place) {
    const chart = calculateNatalChart({
      date: input.date,
      time: input.time,
      latitude: input.place.lat,
      longitude: input.place.lng,
    })
    return {
      precision: 'exact',
      bodies: chart.planets.filter((p) => DRAWN.has(p.planet.id)).map((p) => toBody(p, null)),
      ascendant: chart.ascendant?.longitude ?? null,
    }
  }
  const arcs = getPlanetaryDayArcs(input.date)
  return {
    precision: 'day',
    bodies: getCurrentPlanetaryPositions(input.date)
      .filter((p) => DRAWN.has(p.planet.id))
      .map((p) => toBody(p, arcs.get(p.planet.id) ?? null)),
    ascendant: null,
  }
}
