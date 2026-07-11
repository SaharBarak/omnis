// Composite Bodygraph service for Pleiad — MAPS_ROADMAP #2.
//
// Pair mode: overlays two complete bodygraphs and classifies every one of the
// 36 channels by classic HD connection mechanics (electromagnetic /
// companionship / dominance / compromise), plus which side defines what alone.
// Group mode (the Penta, 3-5 people): aggregates any number of bodygraphs and
// surfaces what the GROUP defines that no individual has — emergent channels
// and emergent centers.
//
// Pure, deterministic, side-effect free. Operates on already-computed
// Bodygraphs (see calculateBodygraph); no ephemeris work happens here.

import type { Bodygraph, CenterId, Channel } from '../types/human-design'
import { CHANNELS } from '../data/human-design-channels'
import { GATES_BY_CENTER } from '../data/human-design-gates'

// ============================================================================
// PUBLIC TYPES — PAIR
// ============================================================================

/** How a single channel reads when two charts are overlaid. */
export type PairChannelState =
  | 'a-defined' // A has the complete channel, B holds neither gate
  | 'b-defined' // B has the complete channel, A holds neither gate
  | 'companionship' // both hold the complete channel
  | 'electromagnetic' // each holds ONE gate — opposite gates; together defined
  | 'dominance-a' // A complete, B holds a single gate of it
  | 'dominance-b' // B complete, A holds a single gate of it
  | 'compromise' // both hold the SAME single hanging gate
  | 'hanging-a' // only A holds a single gate (open on B's side)
  | 'hanging-b' // only B holds a single gate (open on A's side)
  | 'open' // neither holds either gate

export interface PairChannel {
  channel: Channel
  state: PairChannelState
  /** Gates of this channel that A activates (0, 1, or 2 entries). */
  aGates: number[]
  /** Gates of this channel that B activates (0, 1, or 2 entries). */
  bGates: number[]
  /** True when the overlay defines the channel but neither person has it alone. */
  emergent: boolean
}

export interface CompositePair {
  channels: PairChannel[]
  /** Channels defined in the composite (any of the defined states). */
  definedChannelIds: ReadonlySet<string>
  /** Channels defined together that neither has alone (electromagnetic). */
  emergentChannelIds: ReadonlySet<string>
  /** Centers defined in the composite (union of definition through composite channels). */
  definedCenters: ReadonlySet<CenterId>
  /** Centers defined in the composite that NEITHER person has defined alone. */
  emergentCenters: ReadonlySet<CenterId>
  counts: Readonly<Record<Exclude<PairChannelState, 'open'>, number>>
}

// ============================================================================
// PUBLIC TYPES — PENTA / GROUP
// ============================================================================

export interface PentaMemberRef {
  /** Index into the input bodygraphs array. */
  index: number
  /** Which gates of the channel this member activates. */
  gates: number[]
}

export type PentaChannelState =
  | 'individual' // at least one member holds the complete channel alone
  | 'emergent' // group union defines it; no single member has it complete
  | 'hanging' // exactly one gate present across the whole group
  | 'open' // no gate of this channel present in the group

export interface PentaChannel {
  channel: Channel
  state: PentaChannelState
  /** Every member touching this channel, with the gates they contribute. */
  contributors: PentaMemberRef[]
}

export interface PentaAnalysis {
  memberCount: number
  channels: PentaChannel[]
  definedChannelIds: ReadonlySet<string>
  emergentChannelIds: ReadonlySet<string>
  definedCenters: ReadonlySet<CenterId>
  /** Centers the group defines that no individual member has defined. */
  emergentCenters: ReadonlySet<CenterId>
  counts: {
    individual: number
    emergent: number
    hanging: number
  }
}

// ============================================================================
// INTERNAL HELPERS
// ============================================================================

/** Centers with a motor/awareness role still count identically here — a
 * center is defined when at least one channel touching it is defined. */
function centersFromChannels(channelIds: ReadonlySet<string>): Set<CenterId> {
  const defined = new Set<CenterId>()
  for (const channel of CHANNELS) {
    if (channelIds.has(channel.id)) {
      defined.add(channel.centers[0])
      defined.add(channel.centers[1])
    }
  }
  return defined
}

function gatesOf(bodygraph: Bodygraph): ReadonlySet<number> {
  return new Set(bodygraph.gates)
}

function completeChannelIds(bodygraph: Bodygraph): ReadonlySet<string> {
  return new Set(bodygraph.channels.map((c) => c.id))
}

// ============================================================================
// PAIR COMPOSITE
// ============================================================================

const DEFINED_PAIR_STATES: ReadonlySet<PairChannelState> = new Set([
  'a-defined',
  'b-defined',
  'companionship',
  'electromagnetic',
  'dominance-a',
  'dominance-b',
])

function classifyPairChannel(
  channel: Channel,
  aGatesAll: ReadonlySet<number>,
  bGatesAll: ReadonlySet<number>,
  aComplete: ReadonlySet<string>,
  bComplete: ReadonlySet<string>
): PairChannel {
  const [g0, g1] = channel.gates
  const aGates = channel.gates.filter((g) => aGatesAll.has(g))
  const bGates = channel.gates.filter((g) => bGatesAll.has(g))

  // A chart can hold both gates of a channel even when the channel is not in
  // its defined list only in defensive edge cases — treat both-gates as complete.
  const aFull = aComplete.has(channel.id) || (aGatesAll.has(g0) && aGatesAll.has(g1))
  const bFull = bComplete.has(channel.id) || (bGatesAll.has(g0) && bGatesAll.has(g1))

  let state: PairChannelState
  if (aFull && bFull) {
    state = 'companionship'
  } else if (aFull) {
    state = bGates.length === 1 ? 'dominance-a' : 'a-defined'
  } else if (bFull) {
    state = aGates.length === 1 ? 'dominance-b' : 'b-defined'
  } else if (aGates.length === 1 && bGates.length === 1) {
    state = aGates[0] === bGates[0] ? 'compromise' : 'electromagnetic'
  } else if (aGates.length === 1) {
    state = 'hanging-a'
  } else if (bGates.length === 1) {
    state = 'hanging-b'
  } else {
    state = 'open'
  }

  return {
    channel,
    state,
    aGates,
    bGates,
    emergent: state === 'electromagnetic',
  }
}

/**
 * Overlay two complete bodygraphs into a pair composite: every channel
 * classified by connection mechanics, plus emergent channels/centers —
 * definition the couple has that neither person has alone.
 */
export function buildCompositePair(a: Bodygraph, b: Bodygraph): CompositePair {
  const aGatesAll = gatesOf(a)
  const bGatesAll = gatesOf(b)
  const aComplete = completeChannelIds(a)
  const bComplete = completeChannelIds(b)

  const channels = CHANNELS.map((channel) =>
    classifyPairChannel(channel, aGatesAll, bGatesAll, aComplete, bComplete)
  )

  const definedChannelIds = new Set(
    channels.filter((c) => DEFINED_PAIR_STATES.has(c.state)).map((c) => c.channel.id)
  )
  const emergentChannelIds = new Set(
    channels.filter((c) => c.emergent).map((c) => c.channel.id)
  )

  const definedCenters = centersFromChannels(definedChannelIds)
  const individuallyDefined = new Set<CenterId>([
    ...a.definedCenters,
    ...b.definedCenters,
  ])
  const emergentCenters = new Set(
    [...definedCenters].filter((c) => !individuallyDefined.has(c))
  )

  const counts = {
    'a-defined': 0,
    'b-defined': 0,
    companionship: 0,
    electromagnetic: 0,
    'dominance-a': 0,
    'dominance-b': 0,
    compromise: 0,
    'hanging-a': 0,
    'hanging-b': 0,
  }
  for (const c of channels) {
    if (c.state !== 'open') {
      counts[c.state]++
    }
  }

  return {
    channels,
    definedChannelIds,
    emergentChannelIds,
    definedCenters,
    emergentCenters,
    counts,
  }
}

// ============================================================================
// PENTA / GROUP COMPOSITE
// ============================================================================

/**
 * Aggregate 2+ complete bodygraphs into a group composite (the Penta when
 * 3-5). Surfaces per-channel contributors and — the point of the view —
 * what the group defines that no individual member has.
 */
export function buildPenta(bodygraphs: readonly Bodygraph[]): PentaAnalysis {
  if (bodygraphs.length < 2) {
    throw new Error('buildPenta requires at least 2 complete bodygraphs')
  }

  const memberGates = bodygraphs.map(gatesOf)
  const memberComplete = bodygraphs.map(completeChannelIds)

  const channels: PentaChannel[] = CHANNELS.map((channel) => {
    const [g0, g1] = channel.gates

    const contributors: PentaMemberRef[] = []
    let anyoneComplete = false
    let unionHas0 = false
    let unionHas1 = false

    for (let i = 0; i < bodygraphs.length; i++) {
      const gates = channel.gates.filter((g) => memberGates[i].has(g))
      if (gates.length > 0) {
        contributors.push({ index: i, gates })
      }
      if (memberGates[i].has(g0)) unionHas0 = true
      if (memberGates[i].has(g1)) unionHas1 = true
      if (
        memberComplete[i].has(channel.id) ||
        (memberGates[i].has(g0) && memberGates[i].has(g1))
      ) {
        anyoneComplete = true
      }
    }

    let state: PentaChannelState
    if (anyoneComplete) {
      state = 'individual'
    } else if (unionHas0 && unionHas1) {
      state = 'emergent'
    } else if (unionHas0 || unionHas1) {
      state = 'hanging'
    } else {
      state = 'open'
    }

    return { channel, state, contributors }
  })

  const definedChannelIds = new Set(
    channels
      .filter((c) => c.state === 'individual' || c.state === 'emergent')
      .map((c) => c.channel.id)
  )
  const emergentChannelIds = new Set(
    channels.filter((c) => c.state === 'emergent').map((c) => c.channel.id)
  )

  const definedCenters = centersFromChannels(definedChannelIds)
  const individuallyDefined = new Set<CenterId>(
    bodygraphs.flatMap((b) => [...b.definedCenters])
  )
  const emergentCenters = new Set(
    [...definedCenters].filter((c) => !individuallyDefined.has(c))
  )

  return {
    memberCount: bodygraphs.length,
    channels,
    definedChannelIds,
    emergentChannelIds,
    definedCenters,
    emergentCenters,
    counts: {
      individual: channels.filter((c) => c.state === 'individual').length,
      emergent: channels.filter((c) => c.state === 'emergent').length,
      hanging: channels.filter((c) => c.state === 'hanging').length,
    },
  }
}

// Re-exported so chart components can iterate all nine centers without
// reaching into data/ directly.
export const ALL_CENTER_IDS: readonly CenterId[] = Object.freeze(
  Object.keys(GATES_BY_CENTER) as CenterId[]
)
