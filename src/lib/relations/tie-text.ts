import { PLANETS } from '@pleiad/engine/data/planets'
import { mayDrawEdge, type Tier } from '@pleiad/engine/services/rarity'
import { tieOdds } from './odds'
import { centerName, type Tie, type TieSystem } from './pair-ties'

/** Plain-language pieces for a tie. One place, so tables, pins and captions agree. */

export const SYSTEM_LABEL: Readonly<Record<TieSystem, string>> = {
  astrology: 'Astrology',
  dreamspell: 'Dreamspell',
  tzolkin: 'Tzolkin',
  humanDesign: 'Human Design',
  gematria: 'Gematria',
}

/** The names of a tie's facts, wherever a card or a table lists them. */
export const TIE_FACT = Object.freeze({ between: 'Between', rarity: 'Rarity', weight: 'Weight' })

/** A rarity tier in words; where each tier ends is the engine's `TIER_CEILING`. */
export const TIER_LABEL: Readonly<Record<Tier, string>> = {
  T3: 'Rare',
  T2: 'Uncommon',
  T1: 'Common',
  T0: 'Shared by most',
}

const planetName = (id: string): string => PLANETS.find((p) => p.id === id)?.name ?? id

const words = (type: string): string => {
  const text = type.replace(/-/g, ' ')
  return text.charAt(0).toUpperCase() + text.slice(1)
}

/** "Guide", "Double whammy core: Sun and Moon", "Emergent center: Throat". */
export function tieName(tie: Tie, centerName: (id: string) => string): string {
  const base = words(tie.type)
  if (tie.planets) return `${base}: ${planetName(tie.planets[0])} and ${planetName(tie.planets[1])}`
  if (tie.type === 'emergent-center' && tie.channel) return `${base}: ${centerName(tie.channel)}`
  if (tie.channel) return `${base}: channel ${tie.channel}`
  return base
}

/** Who the tie is between, with its direction when it has one. */
export function tieBetween(tie: Tie, name: (id: string) => string): string {
  if (tie.acts && tie.type === 'guide') return `${name(tie.acts.by)} is ${name(tie.acts.on)}'s guide`
  if (tie.acts && tie.type === 'split-bridge') return `${name(tie.acts.by)} bridges ${name(tie.acts.on)}'s split`
  return `${name(tie.from)} and ${name(tie.to)}`
}

export { tieOdds } from './odds'

export const tieBits = (bits: number): string => `${bits.toFixed(1)} bits`

/** The rarest tie a map may draw. Ties arrive rarest first from `pairTies`; null when every tie is common. */
export const headlineTie = (ties: readonly Tie[]): Tie | null => ties.find((t) => mayDrawEdge(t.baseRate)) ?? null

/** A tie in plain words for a view: serialisable, so a server builder can hand it to a client. */
export interface TieView {
  readonly name: string
  readonly system: string
  readonly meaning: string
  /** "1 in 263". */
  readonly odds: string
  /** Measured share of random pairs with this tie, 0 to 1. */
  readonly share: number
  /** Its rarity tier in words. */
  readonly tier: string
  /** What it tells you, in bits (`tieBits` writes it). */
  readonly bits: number
}

export const tieView = (tie: Tie): TieView => ({
  name: tieName(tie, centerName),
  system: SYSTEM_LABEL[tie.system],
  meaning: tie.meaning,
  odds: tieOdds(tie.baseRate),
  share: tie.baseRate,
  tier: TIER_LABEL[tie.tier],
  bits: tie.bits,
})

/** "Guide, 1 in 263", or "Common ties only" when no tie may be drawn. */
export function tieHeadline(ties: readonly Tie[]): string {
  const top = headlineTie(ties)
  return top ? `${tieName(top, centerName)}, ${tieOdds(top.baseRate)}` : 'Common ties only'
}
