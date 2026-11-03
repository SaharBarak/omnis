import { CENTERS } from '@pleiad/engine/data/human-design-centers'
import { andList, loneGates, markTitle, type AtlasMarkRef, type MarkSource } from './marks'
import { bodyValue, placeAt } from './place'
import type { BodyLayer, MayaLayer, MissingInput, NumberLayer, ReadoutRow, SkyLayer } from './types'
import { oracleRole } from '@/lib/dreamspell-oracle'

/**
 * The atlas as text: every value the drawing shows, in reading order, so the
 * drawing carries nothing a reader without it would miss. Mark values come
 * from `markTitle`, the same words the mark cards use.
 */

const NEEDS: Readonly<Record<MissingInput, string>> = {
  time: 'Add a birth time',
  place: 'Add a birth place',
  'time-and-place': 'Add birth time and place',
}

export const needsLabel = (missing: MissingInput): string => NEEDS[missing]

/** Sun and Moon lead the sky; the rest follow the rising sign in the engine's order. */
const HEADLINE = new Set(['sun', 'moon'])

const skyRows = (sky: SkyLayer, needs: MissingInput | null): ReadoutRow[] => [
  ...sky.bodies.filter((b) => HEADLINE.has(b.id)).map((b): ReadoutRow => ({ layer: 'sky', label: b.name, value: bodyValue(b) })),
  {
    layer: 'sky',
    label: 'Rising',
    value: sky.ascendant !== null ? placeAt(sky.ascendant) : needsLabel(needs ?? 'time-and-place'),
  },
  ...sky.bodies.filter((b) => !HEADLINE.has(b.id)).map((b): ReadoutRow => ({ layer: 'sky', label: b.name, value: bodyValue(b) })),
]

const SEATS = ['guide', 'analog', 'antipode', 'occult'] as const

const mayaRows = (maya: MayaLayer): ReadoutRow[] => [
  { layer: 'maya', label: 'Kin', value: `${maya.kin}, ${maya.title}` },
  ...SEATS.map((seat): ReadoutRow => ({ layer: 'maya', label: oracleRole(seat).label, value: maya.oracle[seat].name })),
  { layer: 'maya', label: 'Tzolkin', value: maya.tzolkin },
]

/** Marks as one line: `Abstraction (64–47) and Awareness (61–24)`. */
const listed = (source: MarkSource, refs: readonly AtlasMarkRef[]): string =>
  andList(refs.flatMap((ref) => {
    const title = markTitle(source, ref)
    return title ? [`${title.label} (${title.value})`] : []
  })) || 'None'

const centreNames = (source: MarkSource, body: BodyLayer, defined: boolean): string =>
  andList(
    CENTERS.filter((c) => body.definedCenters.includes(c.id) === defined).flatMap((c) => markTitle(source, { kind: 'centre', id: c.id })?.label ?? []),
  ) || 'None'

const bodyRows = (source: MarkSource, needs: MissingInput | null): ReadoutRow[] => {
  const { body } = source
  if (!body) return [{ layer: 'body', label: 'Bodygraph', value: needsLabel(needs ?? 'time-and-place') }]
  const lone = loneGates(body)
  return [
    { layer: 'body', label: 'Type', value: body.type },
    { layer: 'body', label: 'Strategy', value: body.strategy },
    { layer: 'body', label: 'Authority', value: body.authority },
    { layer: 'body', label: 'Profile', value: body.profile },
    { layer: 'body', label: 'Definition', value: body.definition },
    { layer: 'body', label: 'Defined centres', value: centreNames(source, body, true) },
    { layer: 'body', label: 'Open centres', value: centreNames(source, body, false) },
    ...(body.channels.length > 0
      ? [{ layer: 'body' as const, label: 'Channels', value: listed(source, body.channels.map((c): AtlasMarkRef => ({ kind: 'channel', id: c.id }))) }]
      : []),
    ...(lone.length > 0 ? [{ layer: 'body' as const, label: 'Gates', value: listed(source, lone.map((n): AtlasMarkRef => ({ kind: 'gate', n }))) }] : []),
  ]
}

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
  const source: MarkSource = { sky, maya, body }
  return [...skyRows(sky, needs), ...mayaRows(maya), ...bodyRows(source, needs), ...numberRows(number)]
}
