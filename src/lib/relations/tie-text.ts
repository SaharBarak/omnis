import { PLANETS } from '@pleiad/engine/data/planets'
import { mayDrawEdge } from '@pleiad/engine/services/rarity'
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

/** "Guide, 1 in 263", or "Common ties only" when no tie may be drawn. */
export function tieHeadline(ties: readonly Tie[]): string {
  const top = headlineTie(ties)
  return top ? `${tieName(top, centerName)}, ${tieOdds(top.baseRate)}` : 'Common ties only'
}
