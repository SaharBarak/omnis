import { buildMaya } from './maya'
import type { AtlasPerson } from './pair'
import type { CircleAtlas, PairAtlas, PersonAtlas } from './types'
import type { CircleReading } from './circle'
import type { PairReading } from '@/lib/relations/pair-ties'

const ref = (p: AtlasPerson) => ({ id: p.id, name: p.name })

export const pairAtlasOf = (a: AtlasPerson, b: AtlasPerson, atlasA: PersonAtlas, atlasB: PersonAtlas, reading: PairReading): PairAtlas => ({
  a: atlasA,
  b: atlasB,
  people: [ref(a), ref(b)],
  reading,
})

export const circleAtlasOf = (people: readonly AtlasPerson[], circle: CircleReading): CircleAtlas => ({
  people: people.map((p) => ({ ...ref(p), maya: buildMaya(p.input.date) })),
  circle,
})
