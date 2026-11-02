import { CONNECTION_DESCRIPTIONS } from '@pleiad/engine/data/connection-descriptions'
import type { FiveSystemCompatibility } from '@pleiad/engine/services/compatibility'
import type { CenterId } from '@pleiad/engine/types/human-design'
import { baseRateOf, bySurprisal, rarityBits, rarityScore, surprisal, tierOf, type Tier } from '@pleiad/engine/services/rarity'
import { tieOdds } from './odds'

/**
 * Pair ties: the engine's five-system pair result turned into named ties,
 * each stamped with its measured base rate and its surprisal in bits. Only
 * discriminating findings become ties; near-universal ones are kept as counts
 * (docs/redesign/CONNECTION_ATLAS.md). The homepage demo carries an inline copy
 * of these rules and should import this module once its pending edits land.
 */

export type TieSystem = 'astrology' | 'dreamspell' | 'tzolkin' | 'humanDesign' | 'gematria'
export type TieHarmony = 'supportive' | 'challenging' | 'transformative' | 'neutral'

export interface PersonRef {
  readonly id: string
  readonly name: string
}

export interface Tie {
  readonly system: TieSystem
  readonly from: string
  readonly to: string
  /** The engine's type name, verbatim. */
  readonly type: string
  readonly meaning: string
  readonly harmony: TieHarmony
  readonly score: number
  /** −log₂(measured base rate). */
  readonly bits: number
  /** Measured share of random pairs with this tie. */
  readonly baseRate: number
  /** Atlas tier of the base rate: only T2 and T3 may carry a line. */
  readonly tier: Tier
  /** For directed ties: who acts on whom (the guide on the one it guides, the bridger on the split). */
  readonly acts: { readonly by: string; readonly on: string } | null
  readonly channel?: string
  readonly planets?: readonly [string, string]
}

export interface PairReading {
  readonly a: string
  readonly b: string
  readonly ties: readonly Tie[]
  readonly bits: number
  /** How unusual the pairing is, 0-100. Not "how good". */
  readonly rarity: number
}

const HD_COMPANIONSHIP =
  'Both carry the whole channel. Reinforcing, easy company.'

const TZOLKIN_FALLBACK_SCORE: Readonly<Record<string, number>> = {
  'same-sign': 20,
  'trecena-match': 12,
}

const CORE_WHAMMY = new Set(['sun|moon', 'mars|venus'])

const emChannels = (n: number): string => `${n} ${n === 1 ? 'channel' : 'channels'}`

const CENTER_NAME: Readonly<Record<CenterId, string>> = {
  head: 'Head',
  ajna: 'Ajna',
  throat: 'Throat',
  g: 'G Centre',
  heart: 'Heart',
  sacral: 'Sacral',
  spleen: 'Spleen',
  solar: 'Solar Plexus',
  root: 'Root',
}

export const centerName = (id: string): string => CENTER_NAME[id as CenterId] ?? id

const stripLabel = (s: string): string => s.replace(/^[^-]+-\s*/, '')

/** Ties whose meaning has a direction. The engine reads `guide` as "b is a's guide". */
const ACTS: Readonly<Record<string, (t: Pick<Tie, 'from' | 'to'>) => Tie['acts']>> = {
  guide: (t) => ({ by: t.to, on: t.from }),
  'split-bridge': (t) => ({ by: t.from, on: t.to }),
}

const stamp = (t: Omit<Tie, 'bits' | 'baseRate' | 'tier' | 'acts'>): Tie => {
  const baseRate = baseRateOf(t.type)
  return { ...t, bits: surprisal(t.type), baseRate, tier: tierOf(baseRate), acts: ACTS[t.type]?.(t) ?? null }
}

const dreamspellTies = (r: FiveSystemCompatibility, a: PersonRef, b: PersonRef): Tie[] =>
  (r.dreamspellDetail?.connections ?? []).map((c) =>
    stamp({
      system: 'dreamspell',
      from: a.id,
      to: b.id,
      type: c.type,
      meaning: stripLabel(c.description),
      harmony: c.harmony,
      score: CONNECTION_DESCRIPTIONS[c.type]?.score ?? 0,
    }),
  )

const tzolkinTies = (r: FiveSystemCompatibility, a: PersonRef, b: PersonRef): Tie[] =>
  (r.tzolkinDetail?.connections ?? []).map((c) => {
    const known = CONNECTION_DESCRIPTIONS[c.type as keyof typeof CONNECTION_DESCRIPTIONS]
    return stamp({
      system: 'tzolkin',
      from: a.id,
      to: b.id,
      type: c.type,
      meaning: stripLabel(c.description),
      harmony: known?.harmony ?? 'supportive',
      score: known?.score ?? TZOLKIN_FALLBACK_SCORE[c.type] ?? 0,
    })
  })

const humanDesignTies = (r: FiveSystemCompatibility, a: PersonRef, b: PersonRef): Tie[] => {
  const rel = r.hdDetail?.relation
  if (!rel) return []
  const ties: Tie[] = rel.emergentCenters.map((center) =>
    stamp({
      system: 'humanDesign',
      from: a.id,
      to: b.id,
      type: 'emergent-center',
      meaning: `Together they define the ${centerName(center)}, a centre neither has alone.`,
      harmony: 'transformative',
      score: rel.definedCenterCount,
      channel: center,
    }),
  )
  if (rel.splitBridge) {
    const bridged = rel.splitBridge.bridged === 'person1' ? a : b
    const bridger = rel.splitBridge.bridged === 'person1' ? b : a
    ties.push(
      stamp({
        system: 'humanDesign',
        from: bridger.id,
        to: bridged.id,
        type: 'split-bridge',
        meaning: `${bridger.name} closes ${bridged.name}'s split: together it reads as one piece.`,
        harmony: 'transformative',
        score: rel.splitBridge.islandsAlone,
      }),
    )
  }
  const companionship = r.hdDetail?.connections.find((c) => c.type === 'companionship')
  if (companionship) {
    ties.push(
      stamp({
        system: 'humanDesign',
        from: a.id,
        to: b.id,
        type: 'companionship',
        meaning: HD_COMPANIONSHIP,
        harmony: 'supportive',
        score: rel.counts.companionship,
        channel: companionship.channelId,
      }),
    )
  }
  if (rel.counts.electromagnetic > 0) {
    const em = r.hdDetail?.connections.find((c) => c.type === 'electromagnetic')
    ties.push(
      stamp({
        system: 'humanDesign',
        from: a.id,
        to: b.id,
        type: 'electromagnetic',
        meaning: `${emChannels(rel.counts.electromagnetic)} completed only by the two of them, as in ${tieOdds(baseRateOf('electromagnetic'))}.`,
        harmony: 'transformative',
        score: rel.counts.electromagnetic,
        channel: em?.channelId,
      }),
    )
  }
  return ties
}

const astrologyTies = (r: FiveSystemCompatibility, a: PersonRef, b: PersonRef): Tie[] =>
  (r.synastryDetail?.discriminators ?? []).map((c) => {
    const pairKey = [c.planet1, c.planet2].filter(Boolean).sort().join('|')
    return stamp({
      system: 'astrology',
      from: a.id,
      to: b.id,
      type: c.type === 'double-whammy' && CORE_WHAMMY.has(pairKey) ? 'double-whammy-core' : c.type,
      meaning: c.description ?? c.type.replace(/-/g, ' '),
      harmony: c.harmony === 'challenging' ? 'challenging' : 'supportive',
      score: c.orb !== null ? Math.round((1 - Math.min(c.orb, 8) / 8) * 100) : 50,
      planets: c.planet1 && c.planet2 ? [c.planet1, c.planet2] : undefined,
    })
  })

const gematriaTies = (r: FiveSystemCompatibility, a: PersonRef, b: PersonRef): Tie[] =>
  r.nameMatch?.exact
    ? [
        stamp({
          system: 'gematria',
          from: a.id,
          to: b.id,
          type: 'name-value-match',
          meaning: `Both names carry the value ${r.nameMatch.value1}.`,
          harmony: 'supportive',
          score: r.nameMatch.value1,
        }),
      ]
    : []

/** Rarest first; ties of equal rarity by the tradition's own score. */
export const byRarity = (x: Tie, y: Tie): number => bySurprisal(x, y) || y.score - x.score

export function pairTies(result: FiveSystemCompatibility, a: PersonRef, b: PersonRef): readonly Tie[] {
  return [
    ...dreamspellTies(result, a, b),
    ...tzolkinTies(result, a, b),
    ...humanDesignTies(result, a, b),
    ...astrologyTies(result, a, b),
    ...gematriaTies(result, a, b),
  ].sort(byRarity)
}

export function readPair(result: FiveSystemCompatibility, a: PersonRef, b: PersonRef): PairReading {
  const ties = pairTies(result, a, b)
  return { a: a.id, b: b.id, ties, bits: Math.round(rarityBits(ties) * 10) / 10, rarity: rarityScore(ties) }
}
