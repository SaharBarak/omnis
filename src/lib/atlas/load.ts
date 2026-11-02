import { buildLightAtlas, composeAtlas } from './light'
import { circleAtlasOf, pairAtlasOf } from './bundles'
import type { AtlasPerson } from './pair'
import type { BirthInput, CircleAtlas, PairAtlas, PersonAtlas } from './types'
import type { PairReading } from '@/lib/relations/pair-ties'
import { lazyModule } from '@/lib/lazy-module'

/** Loads the astrology and Human Design engines once, on first use; a failed load retries on the next call. */
export const loadHeavy = lazyModule(() => import('./heavy'))

/** The whole atlas in the browser: light layers now, heavy engines on demand. */
export async function loadPersonAtlas(input: BirthInput, today: string): Promise<PersonAtlas> {
  const light = buildLightAtlas(input, today)
  const { buildSky, buildBody } = await loadHeavy()
  return composeAtlas(light, buildSky(input), buildBody(input))
}

export async function loadPairAtlas(a: AtlasPerson, b: AtlasPerson, today: string): Promise<PairAtlas> {
  const [atlasA, atlasB, heavyMod] = await Promise.all([loadPersonAtlas(a.input, today), loadPersonAtlas(b.input, today), loadHeavy()])
  return pairAtlasOf(a, b, atlasA, atlasB, heavyMod.buildPairReading(a, b))
}

export async function loadCircleAtlas(people: readonly AtlasPerson[]): Promise<CircleAtlas> {
  const { buildCircle } = await loadHeavy()
  return circleAtlasOf(people, buildCircle(people))
}

/** Readings already made this visit, by both people and their birth data (a reading is directional: `a` first). */
const readings = new Map<string, Promise<PairReading>>()
const readingKey = (a: AtlasPerson, b: AtlasPerson): string => JSON.stringify([a.id, a.input, b.id, b.input])

/** One pair's reading, made once per visit for the same two people and birth data; a failed read is forgotten. */
export function loadPairReading(a: AtlasPerson, b: AtlasPerson): Promise<PairReading> {
  const key = readingKey(a, b)
  const known = readings.get(key)
  if (known) return known
  const pending = loadHeavy().then(({ buildPairReading }) => buildPairReading(a, b))
  readings.set(key, pending)
  pending.catch(() => readings.delete(key))
  return pending
}

const yieldToPage = () => new Promise<void>((resolve) => setTimeout(resolve, 0))

/** Readings for each pair in turn, yielding between pairs so the page stays responsive (each is engine work). */
export async function loadPairReadings(pairs: readonly (readonly [AtlasPerson, AtlasPerson])[]): Promise<readonly PairReading[]> {
  const out: PairReading[] = []
  for (const [a, b] of pairs) {
    out.push(await loadPairReading(a, b))
    await yieldToPage()
  }
  return out
}

/** A pair atlas from a reading already made, reusing a person atlas already built. */
export async function loadPairAtlasFrom(a: AtlasPerson, b: AtlasPerson, reading: PairReading, today: string, atlasA?: PersonAtlas): Promise<PairAtlas> {
  const [first, second] = await Promise.all([atlasA ?? loadPersonAtlas(a.input, today), loadPersonAtlas(b.input, today)])
  return pairAtlasOf(a, b, first, second, reading)
}

/** A circle from the visit's readings: only pairs not yet read are read, in turn. */
export async function loadCircleAtlasInTurn(people: readonly AtlasPerson[]): Promise<CircleAtlas> {
  const pairs = people.flatMap((a, i) => people.slice(i + 1).map((b) => [a, b] as const))
  const [read, { layoutCircle }] = await Promise.all([loadPairReadings(pairs), loadHeavy()])
  return circleAtlasOf(people, { ...layoutCircle(people.map((p) => p.id), read), pairs: read })
}
