import { CENTERS } from '@pleiad/engine/data/human-design-centers'
import { CHANNELS } from '@pleiad/engine/data/human-design-channels'
import { SEALS } from '@pleiad/engine/data/seals'
import { TONES } from '@pleiad/engine/data/tones'
import { getZodiacSignFromLongitude, ZODIAC_SIGNS } from '@pleiad/engine/data/zodiac-signs'
import type { PlanetId, ZodiacSignId } from '@pleiad/engine/types/astrology'
import type { CenterId } from '@pleiad/engine/types/human-design'
import { bodyValue, placeAt } from './place'
import type { AtlasLayerId, BodyLayer, MayaLayer, PersonAtlas } from './types'
import { ORACLE_ROLES, type OracleRole, type OracleRoleId } from '@/lib/dreamspell-oracle'

/**
 * The marks a person's atlas draws (docs/redesign/BENTO_SITE.md, "Marks
 * explain themselves"): which marks exist, what each is called and what it
 * reads for this person, and which marks belong with it. Light and pure:
 * only tables the drawing already ships. The meanings live in explain.ts,
 * which loads after first paint.
 */

export type AtlasMarkRef =
  | { readonly kind: 'planet'; readonly id: PlanetId }
  | { readonly kind: 'sign'; readonly id: ZodiacSignId }
  | { readonly kind: 'rising' }
  | { readonly kind: 'seal'; readonly n: number }
  | { readonly kind: 'tone' }
  | { readonly kind: 'centre'; readonly id: CenterId }
  | { readonly kind: 'channel'; readonly id: string }
  | { readonly kind: 'gate'; readonly n: number }

export type AtlasMarkKind = AtlasMarkRef['kind']

/** The parts of an atlas its marks read. */
export type MarkSource = Pick<PersonAtlas, 'sky' | 'maya' | 'body'>

export const MARK_LAYER: Readonly<Record<AtlasMarkKind, AtlasLayerId>> = {
  planet: 'sky',
  sign: 'sky',
  rising: 'sky',
  seal: 'maya',
  tone: 'maya',
  centre: 'body',
  channel: 'body',
  gate: 'body',
}

/** The mark's stable key, written on its element as `data-mark`: `planet:sun`, `seal:12`, `rising`. */
export const markKey = (ref: AtlasMarkRef): string => {
  switch (ref.kind) {
    case 'rising':
    case 'tone':
      return ref.kind
    case 'seal':
    case 'gate':
      return `${ref.kind}:${ref.n}`
    default:
      return `${ref.kind}:${ref.id}`
  }
}

/** What a mark is called and what it reads for this person: the card's head, and its button's name. */
export interface MarkTitle {
  /** What the mark is: secondary. */
  readonly label: string
  /** The person's value at the mark: the strong element. */
  readonly value: string
}

const capital = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1)

/** `A`, `A and B`, `A, B and C`. */
export const andList = (items: readonly string[]): string =>
  items.length <= 1 ? (items[0] ?? '') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`

/** Gates active outside a defined channel: drawn as dots, since a channel already draws its own two. */
export const loneGates = (body: BodyLayer): readonly number[] => {
  const inChannel = new Set(body.channels.flatMap((c) => c.gates))
  return body.gates.filter((g) => !inChannel.has(g))
}

export const centreOfGate = (gate: number): CenterId | null => CENTERS.find((c) => c.gates.includes(gate))?.id ?? null

const centreName = (id: CenterId): string => CENTERS.find((c) => c.id === id)?.name ?? capital(id)

/** A seal's name with its colour, e.g. `Yellow Sun`. */
const sealName = (n: number): string => {
  const seal = SEALS[n - 1]
  return `${capital(seal.color)} ${seal.english}`
}

/** The oracle seats a seal holds in this kin, the person's own seal first. */
export const rolesOf = (maya: MayaLayer, n: number): readonly OracleRole[] => {
  const seat: Readonly<Record<OracleRoleId, number>> = {
    destiny: maya.seal.n,
    guide: maya.oracle.guide.n,
    analog: maya.oracle.analog.n,
    antipode: maya.oracle.antipode.n,
    occult: maya.oracle.occult.n,
  }
  return ORACLE_ROLES.filter((role) => seat[role.id] === n)
}

const signOf = (id: ZodiacSignId) => ZODIAC_SIGNS.find((z) => z.id === id)

/** Label and value for one mark, or null when this atlas does not draw it. */
export function markTitle(atlas: MarkSource, ref: AtlasMarkRef): MarkTitle | null {
  const { sky, maya, body } = atlas
  switch (ref.kind) {
    case 'planet': {
      const found = sky.bodies.find((b) => b.id === ref.id)
      return found ? { label: found.name, value: bodyValue(found) } : null
    }
    case 'sign': {
      const sign = signOf(ref.id)
      if (!sign) return null
      const here = sky.bodies.filter((b) => b.sign.n === sign.number).map((b) => b.name)
      return { label: sign.name, value: here.length > 0 ? andList(here) : 'No planets' }
    }
    case 'rising':
      return sky.ascendant === null ? null : { label: 'Rising', value: placeAt(sky.ascendant) }
    case 'seal': {
      if (!SEALS[ref.n - 1]) return null
      const roles = rolesOf(maya, ref.n)
      return { label: sealName(ref.n), value: roles.length > 0 ? andList(roles.map((r) => r.label)) : `Seal ${ref.n}` }
    }
    case 'tone':
      return { label: 'Tone', value: `${TONES[maya.tone.n - 1].name} ${maya.tone.n}` }
    case 'centre':
      if (!body || !CENTERS.some((c) => c.id === ref.id)) return null
      return { label: centreName(ref.id), value: body.definedCenters.includes(ref.id) ? 'Defined' : 'Open' }
    case 'channel': {
      const drawn = body?.channels.find((c) => c.id === ref.id)
      return drawn ? { label: drawn.name, value: `${drawn.gates[0]}–${drawn.gates[1]}` } : null
    }
    case 'gate': {
      if (!body || !loneGates(body).includes(ref.n)) return null
      const centre = centreOfGate(ref.n)
      return { label: `Gate ${ref.n}`, value: centre ? centreName(centre) : '' }
    }
  }
}

const channelCentres = (id: string): readonly CenterId[] => CHANNELS.find((c) => c.id === id)?.centers ?? []

const SEATS = ['guide', 'analog', 'antipode', 'occult'] as const

const unique = (refs: readonly AtlasMarkRef[], self: AtlasMarkRef): readonly AtlasMarkRef[] => {
  const seen = new Set([markKey(self)])
  return refs.filter((r) => {
    const key = markKey(r)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

/**
 * The marks that stay lit beside the active one: a planet's sign, a sign's
 * planets, the person's seal and its oracle, a centre's channels and the
 * centres they reach. Read from the atlas and the layout tables; none stored.
 */
export function relatedMarks(atlas: MarkSource, ref: AtlasMarkRef): readonly AtlasMarkRef[] {
  const { sky, maya, body } = atlas
  const related = ((): readonly AtlasMarkRef[] => {
    switch (ref.kind) {
      case 'planet': {
        const found = sky.bodies.find((b) => b.id === ref.id)
        const sign = found ? ZODIAC_SIGNS[found.sign.n - 1] : undefined
        return sign ? [{ kind: 'sign', id: sign.id }] : []
      }
      case 'sign': {
        const number = signOf(ref.id)?.number
        return sky.bodies.filter((b) => b.sign.n === number).map((b) => ({ kind: 'planet', id: b.id }))
      }
      case 'rising':
        return sky.ascendant === null ? [] : [{ kind: 'sign', id: getZodiacSignFromLongitude(sky.ascendant).id }]
      case 'seal':
        return rolesOf(maya, ref.n).flatMap((role): AtlasMarkRef[] =>
          role.id === 'destiny'
            ? [...SEATS.map((seat): AtlasMarkRef => ({ kind: 'seal', n: maya.oracle[seat].n })), { kind: 'tone' }]
            : [{ kind: 'seal', n: maya.seal.n }],
        )
      case 'tone':
        return [{ kind: 'seal', n: maya.seal.n }]
      case 'centre': {
        const through = body?.channels.filter((c) => channelCentres(c.id).includes(ref.id)) ?? []
        return [
          ...through.map((c): AtlasMarkRef => ({ kind: 'channel', id: c.id })),
          ...through.flatMap((c) => channelCentres(c.id)).map((id): AtlasMarkRef => ({ kind: 'centre', id })),
        ]
      }
      case 'channel':
        return channelCentres(ref.id).map((id): AtlasMarkRef => ({ kind: 'centre', id }))
      case 'gate': {
        const centre = centreOfGate(ref.n)
        return centre ? [{ kind: 'centre', id: centre }] : []
      }
    }
  })()
  return unique(related, ref)
}
