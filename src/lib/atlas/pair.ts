import { calculateFiveSystemCompatibility, type PersonCompatInput } from '@pleiad/engine/services/compatibility'
import type { BirthInput } from './types'
import { readPair, type PairReading, type PersonRef } from '@/lib/relations/pair-ties'

export interface AtlasPerson extends PersonRef {
  readonly input: BirthInput
}

export const toCompatInput = (input: BirthInput): PersonCompatInput => ({
  birthDate: input.date,
  birthTime: input.time,
  birthPlace: input.place ? { lat: input.place.lat, lng: input.place.lng } : null,
  hebrewName: input.hebrewName,
  name: input.name,
})

/** Every tie the engine finds between two people, rarest first. Heavy. */
export function buildPairReading(a: AtlasPerson, b: AtlasPerson): PairReading {
  return readPair(calculateFiveSystemCompatibility(toCompatInput(a.input), toCompatInput(b.input)), a, b)
}
