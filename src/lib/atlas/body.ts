import { calculateBodygraph } from '@pleiad/engine/calculations/human-design'
import type { Definition } from '@pleiad/engine/types/human-design'
import type { BirthInput, BodyLayer } from './types'

const DEFINITION_LABEL: Readonly<Record<Definition, string>> = {
  single: 'Single',
  split: 'Split',
  'triple-split': 'Triple split',
  'quadruple-split': 'Quadruple split',
  none: 'None',
}

/** Human Design bodygraph. Null until both birth time and place are known. */
export function buildBody(input: BirthInput): BodyLayer | null {
  if (!input.time || !input.place) return null
  const graph = calculateBodygraph({
    birthDate: input.date,
    birthTime: input.time,
    latitude: input.place.lat,
    longitude: input.place.lng,
  })
  if (!('type' in graph)) return null
  return {
    type: graph.typeDefinition.name,
    strategy: graph.typeDefinition.strategy,
    authority: graph.authorityDefinition.name,
    profile: `${graph.profile.id} ${graph.profile.name}`,
    definition: DEFINITION_LABEL[graph.definition],
    cross: graph.incarnationCross.name,
    definedCenters: graph.definedCenters,
    channels: graph.channels.map((c) => ({ id: c.id, name: c.name, gates: c.gates })),
    gates: graph.gates,
  }
}
