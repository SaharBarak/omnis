import { HOUSES } from '@pleiad/engine/data/houses'
import { CENTERS } from '@pleiad/engine/data/human-design-centers'
import { CHANNELS } from '@pleiad/engine/data/human-design-channels'
import { GATES } from '@pleiad/engine/data/human-design-gates'
import { PLANETS } from '@pleiad/engine/data/planets'
import { ZODIAC_SIGNS } from '@pleiad/engine/data/zodiac-signs'
import { getCastleByKin } from '@pleiad/engine/data/castles'
import { getAuthorityDefinition, getProfile, getTypeDefinition, LINE_THEMES } from '@pleiad/engine/data/human-design'
import { getWavespellByKin } from '@pleiad/engine/data/wavespells'
import { tileMeta, tileSystem, type TileId } from './digest-shape'
import { PLACE_NAMES, placeDays } from './long-count'
import { andList, capital, centreName, MARK_LAYER, markTitle, rolesOf, type AtlasMarkKind, type AtlasMarkRef, type MarkSource, type MarkTitle } from './marks'
import { signsOf } from './place'
import { isMarkRef, numberWords, type NumberRole, type ReadingRef, type ReadingSource } from './readings'
import type { AtlasLayerId } from './types'
import { getSealMeaning, getToneMeaning } from '@/lib/dreamspell-meanings'
import { ORACLE_ROLES } from '@/lib/dreamspell-oracle'
import { SYSTEM_CATALOG } from '@/lib/system-preferences'

/**
 * What the tradition reads into a mark on the atlas (docs/redesign/BENTO_SITE.md,
 * "Marks explain themselves"). Pure and server-safe. The card's head is the
 * mark's title from marks.ts; this adds the meaning and the facts, every line
 * from a table the product already reads. A source with nothing for a mark
 * leaves that line out. The browser loads this module after first paint.
 */

export interface MarkFact {
  readonly label: string
  readonly value: string
}

/** What explain adds to a mark's title. */
export interface MarkReading {
  readonly meaning: string | null
  readonly facts: readonly MarkFact[]
}

export interface MarkExplanation extends MarkTitle, MarkReading {
  readonly layer: AtlasLayerId
  readonly kind: AtlasMarkKind
}

/** Keywords as one sentence: `Identity, vitality, ego.` */
const sentence = (words: readonly string[]): string | null => (words.length === 0 ? null : `${capital(words.join(', '))}.`)

/** Sentences joined, the empty ones left out. */
const prose = (...parts: readonly (string | null)[]): string | null => parts.filter(Boolean).join(' ') || null

const fact = (label: string, value: string): MarkFact => ({ label, value })

const NOTHING: MarkReading = { meaning: null, facts: [] }

function reading(atlas: MarkSource, ref: AtlasMarkRef): MarkReading {
  switch (ref.kind) {
    case 'planet': {
      const planet = PLANETS.find((p) => p.id === ref.id)
      return planet ? { meaning: sentence(planet.keywords), facts: [fact('Kind', capital(planet.type))] } : NOTHING
    }
    case 'sign': {
      const sign = ZODIAC_SIGNS.find((z) => z.id === ref.id)
      if (!sign) return NOTHING
      const ruler = PLANETS.find((p) => p.id === sign.ruler)?.name ?? capital(sign.ruler)
      return {
        meaning: sentence(sign.keywords),
        facts: [fact('Element', capital(sign.element)), fact('Modality', capital(sign.modality)), fact('Ruler', ruler)],
      }
    }
    case 'rising': {
      const first = HOUSES[0]
      return { meaning: prose(`${first.theme}.`, sentence(first.keywords)), facts: [fact('House', first.name)] }
    }
    case 'seal':
      return { meaning: rolesOf(atlas.maya, ref.n)[0]?.description ?? null, facts: sealFacts(ref.n) }
    case 'tone': {
      const tone = getToneMeaning(atlas.maya.tone.n)
      return { meaning: null, facts: [fact('Action', tone.action), fact('Power', tone.power), fact('Phase', tone.phase)] }
    }
    case 'centre': {
      const centre = CENTERS.find((c) => c.id === ref.id)
      if (!centre) return NOTHING
      const open = !atlas.body?.definedCenters.includes(ref.id)
      return { meaning: centre.function, facts: open ? [fact('Not-self', centre.notSelfTheme)] : [] }
    }
    case 'channel': {
      const channel = CHANNELS.find((c) => c.id === ref.id)
      return channel
        ? { meaning: sentence(channel.keywords), facts: [fact('Joins', andList(channel.centers.map(centreName))), fact('Circuit', capital(channel.circuitry))] }
        : NOTHING
    }
    case 'gate': {
      const gate = GATES.find((g) => g.number === ref.n)
      return gate ? { meaning: prose(`${gate.name}.`, sentence(gate.keywords)), facts: [] } : NOTHING
    }
  }
}

/** The card for one mark of this atlas, or null when the atlas does not draw it. */
export function explain(atlas: MarkSource, ref: AtlasMarkRef): MarkExplanation | null {
  const title = markTitle(atlas, ref)
  return title ? { ...title, layer: MARK_LAYER[ref.kind], kind: ref.kind, ...reading(atlas, ref) } : null
}

/* ---------- digest readings (BENTO_SITE.md, "Facts explain themselves") ---------- */

const count = new Intl.NumberFormat('en-US')

const days = (n: number): string => `${count.format(n)} ${n === 1 ? 'day' : 'days'}`

const description = (tile: TileId): string | null => {
  const key = tileSystem(tile)
  const found = SYSTEM_CATALOG.find((system) => system.key === key)
  return found ? `${found.description}.` : null
}

const NUMBER_FROM: Readonly<Record<NumberRole, string>> = {
  lifePath: 'Birth date',
  birthday: 'Day of birth',
  expression: 'Full name, in Latin letters',
}

const numberAt = (atlas: ReadingSource, role: NumberRole): number | null => atlas.number[role]

function systemReading(tile: TileId): MarkReading {
  const meta = tileMeta(tile)
  return { meaning: description(tile), facts: [fact('Reads', meta.reads), fact('Needs', meta.needs)] }
}

/** The seal's own facts: what any seat it holds shares. */
const sealFacts = (n: number): readonly MarkFact[] => {
  const seal = getSealMeaning(n)
  return [fact('Power', seal.power), fact('Action', seal.action), fact('Essence', seal.essence)]
}

function placementReading(atlas: ReadingSource, id: string): MarkReading {
  const body = atlas.sky.bodies.find((b) => b.id === id)
  const planet = PLANETS.find((p) => p.id === id)
  if (!body || !planet) return NOTHING
  const signs = signsOf(body)
  if (signs.length > 1) return { meaning: sentence(planet.keywords), facts: [fact('Sign', signs.map((s) => s.name).join(' or '))] }
  const sign = ZODIAC_SIGNS[signs[0].n - 1]
  const ruler = PLANETS.find((p) => p.id === sign.ruler)?.name ?? capital(sign.ruler)
  return {
    meaning: prose(sentence(planet.keywords), sentence(sign.keywords)),
    facts: [fact('Element', capital(sign.element)), fact('Modality', capital(sign.modality)), fact('Ruler', ruler)],
  }
}

/** What explain adds to a digest fact: its meaning and facts. The fact's own label and value head the card. */
export function explainReading(atlas: ReadingSource, ref: ReadingRef): MarkReading {
  if (isMarkRef(ref)) return reading(atlas, ref)
  const { maya, body, longCount } = atlas
  switch (ref.kind) {
    case 'system':
      return systemReading(ref.id)
    case 'seat': {
      const role = ORACLE_ROLES.find((r) => r.id === ref.role)
      const n = ref.role === 'destiny' ? maya.seal.n : maya.oracle[ref.role].n
      return { meaning: role?.description ?? null, facts: sealFacts(n) }
    }
    case 'kin': {
      const wavespell = getWavespellByKin(maya.kin)
      const castle = getCastleByKin(maya.kin)
      return {
        meaning: `${wavespell.purpose}.`,
        facts: [fact('Wavespell', wavespell.name), fact('Castle', `${capital(castle.color)} ${castle.name}`), fact('Court', castle.court)],
      }
    }
    case 'type': {
      if (!body) return systemReading('body')
      const type = getTypeDefinition(body.typeId)
      return {
        meaning: `${capital(type.aura)} aura.`,
        facts: [
          fact('Strategy', type.strategy),
          fact('Signature', type.signatureTheme),
          fact('Not-self', type.notSelfTheme),
          fact('Share of people', type.population),
        ],
      }
    }
    case 'profile': {
      const profile = body ? getProfile(body.profileLines) : undefined
      if (!profile) return NOTHING
      const lines = [...new Set([profile.conscious, profile.unconscious])]
      return { meaning: profile.theme, facts: lines.map((line) => fact(LINE_THEMES[line].name, capital(LINE_THEMES[line].theme))) }
    }
    case 'authority': {
      if (!body) return NOTHING
      const authority = getAuthorityDefinition(body.authorityId)
      return { meaning: authority.description, facts: [fact('Decision', authority.decisionProcess)] }
    }
    case 'number': {
      const n = numberAt(atlas, ref.role)
      const words = n === null ? null : numberWords(n)
      return { meaning: words?.reads ? `${capital(words.reads)}.` : null, facts: [fact('From', NUMBER_FROM[ref.role])] }
    }
    case 'longcount':
      return {
        meaning: description('longcount'),
        facts: [fact('Since creation', days(longCount.days)), fact("Tzolk'in", longCount.tzolkin), fact('Haab', longCount.haab)],
      }
    case 'place': {
      const name = PLACE_NAMES[ref.unit]
      const value = longCount.places[longCount.places.length - 1 - ref.unit]
      if (name === undefined || value === undefined) return NOTHING
      const unit = placeDays(ref.unit)
      return { meaning: `One ${name.toLowerCase()} holds ${days(unit)}.`, facts: [fact('Count', days(value * unit))] }
    }
    case 'placement':
      return placementReading(atlas, ref.id)
  }
}
