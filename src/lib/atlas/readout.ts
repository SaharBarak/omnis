import { getZodiacSignFromLongitude } from '@pleiad/engine/data/zodiac-signs'
import type { BodyLayer, MayaLayer, MissingInput, NumberLayer, ReadoutRow, SkyBody, SkyLayer } from './types'

const NEEDS: Readonly<Record<MissingInput, string>> = {
  time: 'Add a birth time',
  place: 'Add a birth place',
  'time-and-place': 'Add birth time and place',
}

export const needsLabel = (missing: MissingInput): string => NEEDS[missing]

const at = (longitude: number): string =>
  `${getZodiacSignFromLongitude(longitude).name} ${Math.floor((((longitude % 360) + 360) % 360) % 30)}°`

const bodyValue = (b: SkyBody): string => {
  const place = b.arc && Math.abs(b.arc[1] - b.arc[0]) >= 1 ? `${at(b.arc[0])} to ${at(b.arc[1])}` : at(b.longitude)
  return b.retrograde ? `${place}, retrograde` : place
}

const skyRows = (sky: SkyLayer, needs: MissingInput | null): ReadoutRow[] => {
  const find = (id: string) => sky.bodies.find((b) => b.id === id)
  const sun = find('sun')
  const moon = find('moon')
  return [
    ...(sun ? [{ layer: 'sky' as const, label: 'Sun', value: bodyValue(sun) }] : []),
    ...(moon ? [{ layer: 'sky' as const, label: 'Moon', value: bodyValue(moon) }] : []),
    {
      layer: 'sky',
      label: 'Rising',
      value: sky.ascendant !== null ? at(sky.ascendant) : needsLabel(needs ?? 'time-and-place'),
    },
  ]
}

const mayaRows = (maya: MayaLayer): ReadoutRow[] => [
  { layer: 'maya', label: 'Kin', value: `${maya.kin}, ${maya.title}` },
  { layer: 'maya', label: 'Guide', value: maya.oracle.guide.name },
  { layer: 'maya', label: 'Analog', value: maya.oracle.analog.name },
  { layer: 'maya', label: 'Antipode', value: maya.oracle.antipode.name },
  { layer: 'maya', label: 'Occult', value: maya.oracle.occult.name },
  { layer: 'maya', label: 'Tzolkin', value: maya.tzolkin },
]

const bodyRows = (body: BodyLayer | null, needs: MissingInput | null): ReadoutRow[] =>
  body
    ? [
        { layer: 'body', label: 'Type', value: body.type },
        { layer: 'body', label: 'Strategy', value: body.strategy },
        { layer: 'body', label: 'Authority', value: body.authority },
        { layer: 'body', label: 'Profile', value: body.profile },
        { layer: 'body', label: 'Definition', value: body.definition },
      ]
    : [{ layer: 'body', label: 'Bodygraph', value: needsLabel(needs ?? 'time-and-place') }]

const numberRows = (n: NumberLayer): ReadoutRow[] => [
  { layer: 'number', label: 'Life path', value: String(n.lifePath) },
  { layer: 'number', label: 'Birthday', value: String(n.birthday) },
  ...(n.expression !== null ? [{ layer: 'number' as const, label: 'Expression', value: String(n.expression) }] : []),
  { layer: 'number', label: 'Personal year', value: String(n.personalYear) },
]

export function buildReadout(
  sky: SkyLayer,
  maya: MayaLayer,
  body: BodyLayer | null,
  number: NumberLayer,
  needs: MissingInput | null,
): readonly ReadoutRow[] {
  return [...skyRows(sky, needs), ...mayaRows(maya), ...bodyRows(body, needs), ...numberRows(number)]
}
