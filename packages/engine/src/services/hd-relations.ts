/**
 * Human Design — the relations that actually carry signal.
 *
 * WHY THIS FILE EXISTS. The four channel connections (electromagnetic,
 * companionship, dominance, compromise) are canonical, and three of them are
 * useless as findings: measured over 780 random pairs, electromagnetic fires on
 * 95.4% of them, dominance on 96.3%, compromise on 96.0% — several times over
 * each. Two full bodygraphs almost always share one gate of *some* channel.
 * "You two have an electromagnetic connection" is a coin that lands heads 97%
 * of the time. (An independent Monte Carlo over 200k pairs agrees: ~98%.)
 *
 * What the lineage itself says to lead with, and what is actually selective:
 *   1. Type / Strategy / Authority interplay — structural, not statistical.
 *   2. EMERGENT definition — the centers and channels the pair defines that
 *      NEITHER has alone. Jovian calls this the third entity; it is the one
 *      thing that exists only because these two specific people met.
 *   3. The connection theme (9-0 … 5-4) — how many centers the pair defines.
 *      A low-variance scalar with real behavioural meaning.
 *   4. Split bridging — one person closing the gap between the other's two
 *      islands of definition. Rare, specific, high-meaning.
 *   5. Companionship — the only channel type that isn't near-universal (32%).
 *   6. Electromagnetic COUNT and location — never its existence.
 *
 * See docs/redesign/CONNECTION_ATLAS.md §5.
 */
import type { Bodygraph, CenterId, Channel, Definition } from '../types/human-design'
import { CHANNELS } from '../data/human-design-channels'
import { buildCompositePair, type CompositePair } from './composite-bodygraph'

// ============================================================================
// CONNECTION THEMES — by how many of the nine centers the pair defines.
// ============================================================================

export type ConnectionThemeId = '9-0' | '8-1' | '7-2' | '6-3' | '5-4' | 'below-5'

export interface ConnectionTheme {
  readonly id: ConnectionThemeId
  readonly name: string
  readonly nameHebrew: string
  readonly definedCenters: number
  readonly description: string
}

const THEMES: Record<ConnectionThemeId, { name: string; nameHebrew: string; description: string }> = {
  '9-0': {
    name: 'Nowhere to Go',
    nameHebrew: 'אין לאן ללכת',
    description: 'Every centre defined between you. Deeply bonded and self-contained, with little escape from each other.',
  },
  '8-1': {
    name: 'Have Some Fun',
    nameHebrew: 'תיהנו קצת',
    description: 'One centre left open. Easy, playful, with a single shared window on the world.',
  },
  '7-2': {
    name: 'Work to Do',
    nameHebrew: 'יש עבודה',
    description: 'Two centres open together. A relationship with a project in it.',
  },
  '6-3': {
    name: 'Better to Be Free',
    nameHebrew: 'מוטב להיות חופשי',
    description: 'Three centres open. Needs independence and a great deal of talking.',
  },
  '5-4': {
    name: 'Not a Relationship Anymore',
    nameHebrew: 'כבר לא מערכת יחסים',
    description: 'Four centres open. Very different worlds: you have to choose each other, consciously.',
  },
  'below-5': {
    name: 'Barely Defined',
    nameHebrew: 'כמעט ללא הגדרה',
    description: 'Fewer than five centres defined between you. Almost everything is open, in both of you at once.',
  },
}

function themeFor(definedCenters: number): ConnectionTheme {
  const id: ConnectionThemeId =
    definedCenters >= 9 ? '9-0'
    : definedCenters === 8 ? '8-1'
    : definedCenters === 7 ? '7-2'
    : definedCenters === 6 ? '6-3'
    : definedCenters === 5 ? '5-4'
    : 'below-5'
  return { id, ...THEMES[id], definedCenters }
}

// ============================================================================
// SPLIT BRIDGING
// ============================================================================

/**
 * How many separate islands of definition a set of channels makes.
 *
 * A split is two islands; a bridge is a partner whose gates connect them, so
 * that in their presence the split reads as single definition. Ra's caution is
 * that a split will chase the bridge — which is exactly why it is worth naming.
 */
function islandCount(channelIds: ReadonlySet<string>): number {
  const centersOf = new Map<string, readonly [CenterId, CenterId]>()
  for (const ch of CHANNELS) {
    if (channelIds.has(ch.id)) centersOf.set(ch.id, ch.centers)
  }
  if (centersOf.size === 0) return 0

  // Union-find over the centers touched by these channels.
  const parent = new Map<CenterId, CenterId>()
  const find = (c: CenterId): CenterId => {
    const p = parent.get(c)
    if (p === undefined || p === c) return c
    const root = find(p)
    parent.set(c, root)
    return root
  }
  const union = (a: CenterId, b: CenterId) => {
    if (!parent.has(a)) parent.set(a, a)
    if (!parent.has(b)) parent.set(b, b)
    const ra = find(a)
    const rb = find(b)
    if (ra !== rb) parent.set(ra, rb)
  }

  for (const [, [c1, c2]] of centersOf) union(c1, c2)

  const roots = new Set<CenterId>()
  for (const c of parent.keys()) roots.add(find(c))
  return roots.size
}

const completeChannelIds = (bg: Bodygraph): ReadonlySet<string> =>
  new Set(bg.channels.map((c: Channel) => c.id))

export interface SplitBridge {
  /** Which person's split the other closes. */
  readonly bridged: 'person1' | 'person2'
  readonly definitionBefore: Definition
  /** Islands they carry alone, versus in the other's presence. */
  readonly islandsAlone: number
  readonly islandsTogether: number
}

// ============================================================================
// PROFILE HARMONY — canonical (Bunnell / Jovian).
// ============================================================================

/** The harmonic line pairs. Same line resonates; 1↔4, 2↔5, 3↔6 harmonize. */
const HARMONIC: Record<number, number> = { 1: 4, 2: 5, 3: 6, 4: 1, 5: 2, 6: 3 }

export type ProfileFit = 'resonance' | 'harmony' | 'dissonant'

/**
 * Resonance/harmony does NOT predict correctness — Strategy and Authority does.
 * Bunnell is explicit about that, and so are we: this is a texture, not a verdict.
 */
function profileFit(p1: string, p2: string): ProfileFit {
  const lines = (id: string) => id.split('/').map((n) => Number(n)).filter((n) => n >= 1 && n <= 6)
  const a = lines(p1)
  const b = lines(p2)
  if (a.length !== 2 || b.length !== 2) return 'dissonant'

  if (a[0] === b[0] && a[1] === b[1]) return 'resonance'
  for (const la of a) {
    for (const lb of b) {
      if (la === lb) return 'resonance'
    }
  }
  for (const la of a) {
    for (const lb of b) {
      if (HARMONIC[la] === lb) return 'harmony'
    }
  }
  return 'dissonant'
}

// ============================================================================
// THE RELATION
// ============================================================================

export interface HDRelation {
  /** Centres the pair defines that NEITHER person has alone. The third entity. */
  readonly emergentCenters: readonly CenterId[]
  /** Channels only the pair completes. */
  readonly emergentChannels: readonly Channel[]
  /** How many of the nine centres are defined between them. */
  readonly definedCenterCount: number
  readonly theme: ConnectionTheme
  /** One person closing the other's split, when it happens. */
  readonly splitBridge: SplitBridge | null
  /** Counts, never mere existence — existence is ~95% and says nothing. */
  readonly counts: {
    readonly electromagnetic: number
    readonly companionship: number
    readonly dominance: number
    readonly compromise: number
  }
  readonly profileFit: ProfileFit
  readonly composite: CompositePair
}

/**
 * Build the Human Design relation between two complete bodygraphs.
 *
 * Requires birth time and place for BOTH people — without them there is no
 * bodygraph, and there is nothing honest to say.
 */
export function buildHDRelation(a: Bodygraph, b: Bodygraph): HDRelation {
  const composite = buildCompositePair(a, b)

  const emergentChannels = CHANNELS.filter((c) => composite.emergentChannelIds.has(c.id))

  // Does either person's split close in the other's presence?
  const together = composite.definedChannelIds
  let splitBridge: SplitBridge | null = null
  for (const [who, self] of [['person1', a], ['person2', b]] as const) {
    if (self.definition !== 'split' && self.definition !== 'triple-split') continue
    const alone = islandCount(completeChannelIds(self))
    const joined = islandCount(together)
    if (joined === 1 && alone > 1) {
      splitBridge = {
        bridged: who,
        definitionBefore: self.definition,
        islandsAlone: alone,
        islandsTogether: joined,
      }
      break
    }
  }

  return {
    emergentCenters: [...composite.emergentCenters],
    emergentChannels,
    definedCenterCount: composite.definedCenters.size,
    theme: themeFor(composite.definedCenters.size),
    splitBridge,
    counts: {
      electromagnetic: composite.counts.electromagnetic,
      companionship: composite.counts.companionship,
      dominance: composite.counts['dominance-a'] + composite.counts['dominance-b'],
      compromise: composite.counts.compromise,
    },
    profileFit: profileFit(a.profile.id, b.profile.id),
    composite,
  }
}
