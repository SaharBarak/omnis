import { calculateBodygraph } from '@pleiad/engine/calculations/human-design'
import type { Authority, CenterId, Definition } from '@pleiad/engine/types/human-design'
import type { BirthInput, BodyLayer } from './types'

const DEFINITION_LABEL: Readonly<Record<Definition, string>> = {
  single: 'Single',
  split: 'Split',
  'triple-split': 'Triple split',
  'quadruple-split': 'Quadruple split',
  none: 'None',
}

/** Each authority's own word, without "Authority". */
const AUTHORITY_WORD: Readonly<Record<Authority, string>> = {
  emotional: 'Emotional',
  sacral: 'Sacral',
  splenic: 'Splenic',
  'ego-manifested': 'Ego manifested',
  'ego-projected': 'Ego projected',
  'self-projected': 'Self-projected',
  mental: 'Mental',
  lunar: 'Lunar',
}

/** The centre each inner authority speaks from; mental and lunar authority have none of their own. */
const AUTHORITY_CENTRE: Readonly<Record<Authority, CenterId | null>> = {
  emotional: 'solar',
  sacral: 'sacral',
  splenic: 'spleen',
  'ego-manifested': 'heart',
  'ego-projected': 'heart',
  'self-projected': 'g',
  mental: null,
  lunar: null,
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
    authorityWord: AUTHORITY_WORD[graph.authority],
    authorityCentre: AUTHORITY_CENTRE[graph.authority],
    profile: `${graph.profile.id} ${graph.profile.name}`,
    profileLines: graph.profile.id,
    profileName: graph.profile.name,
    typeId: graph.type,
    authorityId: graph.authority,
    definition: DEFINITION_LABEL[graph.definition],
    cross: graph.incarnationCross.name,
    definedCenters: graph.definedCenters,
    channels: graph.channels.map((c) => ({ id: c.id, name: c.name, gates: c.gates })),
    gates: graph.gates,
  }
}
