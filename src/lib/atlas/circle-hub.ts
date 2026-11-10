import type { CircleAtlas } from './types'

/** The person a circle is drawn around: the one whose ties carry the most (`layoutCircle`). Client safe: it reads the atlas only. */
export const hubOf = (circle: CircleAtlas): CircleAtlas['people'][number] | null => circle.people.find((person) => person.id === circle.circle.hub) ?? null
