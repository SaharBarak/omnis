import { buildBody } from './body'
import { circleAtlasOf, pairAtlasOf } from './bundles'
import { buildCircle } from './circle'
import { buildPairReading, type AtlasPerson } from './pair'
import { buildLightAtlas, composeAtlas } from './light'
import { buildSky } from './sky'
import type { BirthInput, CircleAtlas, PairAtlas, PersonAtlas } from './types'

/** The whole atlas, synchronously. For server components and tests; client code uses load.ts. */
export function buildPersonAtlas(input: BirthInput, today: string): PersonAtlas {
  return composeAtlas(buildLightAtlas(input, today), buildSky(input), buildBody(input))
}

export function buildPairAtlas(a: AtlasPerson, b: AtlasPerson, today: string): PairAtlas {
  return pairAtlasOf(a, b, buildPersonAtlas(a.input, today), buildPersonAtlas(b.input, today), buildPairReading(a, b))
}

export function buildCircleAtlas(people: readonly AtlasPerson[]): CircleAtlas {
  return circleAtlasOf(people, buildCircle(people))
}
