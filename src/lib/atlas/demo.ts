import type { AtlasPerson } from './pair'
import { DEMO_PEOPLE, type DemoPerson } from '@/lib/data/homepage-demo'

/** The homepage's six sample people as atlas inputs. Their oracle ties are verified in homepage-demo.ts. */
export const toAtlasPerson = (p: DemoPerson): AtlasPerson => ({
  id: p.id,
  name: p.name,
  input: {
    date: p.birthDate,
    time: p.birthTime,
    place: { lat: p.lat, lng: p.lng, label: null },
    name: p.name,
    hebrewName: p.hebrewName,
  },
})

export const DEMO_ATLAS_PEOPLE: readonly AtlasPerson[] = DEMO_PEOPLE.map(toAtlasPerson)

export const demoPerson = (id: string): AtlasPerson => {
  const found = DEMO_ATLAS_PEOPLE.find((p) => p.id === id)
  if (!found) throw new Error(`No demo person "${id}"`)
  return found
}
