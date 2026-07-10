/**
 * Human Design Channels Data
 *
 * The 36 channels connect pairs of gates across different centers.
 * A channel is "defined" when both of its gates are activated.
 */

import type { Channel, CenterId, Circuitry } from '../types/human-design'

/**
 * All 36 channels with their gate pairs, centers, and circuitry
 */
export const CHANNELS: readonly Channel[] = Object.freeze([
  // === HEAD TO AJNA (3 channels) ===
  {
    id: '64-47',
    name: 'Abstraction',
    nameHebrew: 'הפשטה',
    gates: Object.freeze([64, 47] as [number, number]),
    centers: Object.freeze(['head', 'ajna'] as [CenterId, CenterId]),
    circuitry: 'collective',
    keywords: Object.freeze(['mental activity', 'confusion to clarity', 'abstract thinking']),
  },
  {
    id: '61-24',
    name: 'Awareness',
    nameHebrew: 'מודעות',
    gates: Object.freeze([61, 24] as [number, number]),
    centers: Object.freeze(['head', 'ajna'] as [CenterId, CenterId]),
    circuitry: 'individual',
    keywords: Object.freeze(['knowing', 'inspiration', 'inner truth']),
  },
  {
    id: '63-4',
    name: 'Logic',
    nameHebrew: 'לוגיקה',
    gates: Object.freeze([63, 4] as [number, number]),
    centers: Object.freeze(['head', 'ajna'] as [CenterId, CenterId]),
    circuitry: 'collective',
    keywords: Object.freeze(['logical mind', 'doubt to answers', 'questioning']),
  },

  // === AJNA TO THROAT (3 channels) ===
  {
    id: '17-62',
    name: 'Acceptance',
    nameHebrew: 'קבלה',
    gates: Object.freeze([17, 62] as [number, number]),
    centers: Object.freeze(['ajna', 'throat'] as [CenterId, CenterId]),
    circuitry: 'collective',
    keywords: Object.freeze(['logical opinion', 'detail', 'organizational skills']),
  },
  {
    id: '43-23',
    name: 'Structuring',
    nameHebrew: 'מבנה',
    gates: Object.freeze([43, 23] as [number, number]),
    centers: Object.freeze(['ajna', 'throat'] as [CenterId, CenterId]),
    circuitry: 'individual',
    keywords: Object.freeze(['insight', 'genius', 'individual knowing']),
  },
  {
    id: '11-56',
    name: 'Curiosity',
    nameHebrew: 'סקרנות',
    gates: Object.freeze([11, 56] as [number, number]),
    centers: Object.freeze(['ajna', 'throat'] as [CenterId, CenterId]),
    circuitry: 'collective',
    keywords: Object.freeze(['ideas', 'stimulation', 'storytelling']),
  },

  // === G CENTER TO THROAT (4 channels) ===
  {
    id: '7-31',
    name: 'The Alpha',
    nameHebrew: 'האלפא',
    gates: Object.freeze([7, 31] as [number, number]),
    centers: Object.freeze(['g', 'throat'] as [CenterId, CenterId]),
    circuitry: 'collective',
    keywords: Object.freeze(['leadership', 'influence', 'democratic']),
  },
  {
    id: '1-8',
    name: 'Inspiration',
    nameHebrew: 'השראה',
    gates: Object.freeze([1, 8] as [number, number]),
    centers: Object.freeze(['g', 'throat'] as [CenterId, CenterId]),
    circuitry: 'individual',
    keywords: Object.freeze(['creative expression', 'contribution', 'role model']),
  },
  {
    id: '13-33',
    name: 'The Prodigal',
    nameHebrew: 'הבן האובד',
    gates: Object.freeze([13, 33] as [number, number]),
    centers: Object.freeze(['g', 'throat'] as [CenterId, CenterId]),
    circuitry: 'collective',
    keywords: Object.freeze(['witness', 'remembering', 'sharing experience']),
  },
  {
    id: '10-20',
    name: 'Awakening',
    nameHebrew: 'התעוררות',
    gates: Object.freeze([10, 20] as [number, number]),
    centers: Object.freeze(['g', 'throat'] as [CenterId, CenterId]),
    circuitry: 'integration',
    keywords: Object.freeze(['commitment to self', 'being in the now', 'awakening']),
  },

  // === HEART TO THROAT (2 channels) ===
  {
    id: '21-45',
    name: 'Money',
    nameHebrew: 'כסף',
    gates: Object.freeze([21, 45] as [number, number]),
    centers: Object.freeze(['heart', 'throat'] as [CenterId, CenterId]),
    circuitry: 'tribal',
    keywords: Object.freeze(['material world', 'control', 'willpower']),
  },
  {
    id: '26-44',
    name: 'Surrender',
    nameHebrew: 'כניעה',
    gates: Object.freeze([26, 44] as [number, number]),
    centers: Object.freeze(['heart', 'spleen'] as [CenterId, CenterId]),
    circuitry: 'tribal',
    keywords: Object.freeze(['transmission', 'memory', 'alertness']),
  },

  // === HEART TO G CENTER (1 channel) ===
  {
    id: '25-51',
    name: 'Initiation',
    nameHebrew: 'יזום',
    gates: Object.freeze([25, 51] as [number, number]),
    centers: Object.freeze(['g', 'heart'] as [CenterId, CenterId]),
    circuitry: 'individual',
    keywords: Object.freeze(['spirit', 'shock', 'competitive']),
  },

  // === SPLEEN TO THROAT (1 channel) ===
  {
    id: '57-20',
    name: 'The Brainwave',
    nameHebrew: 'גל המוח',
    gates: Object.freeze([57, 20] as [number, number]),
    centers: Object.freeze(['spleen', 'throat'] as [CenterId, CenterId]),
    circuitry: 'integration',
    keywords: Object.freeze(['intuitive clarity', 'survival', 'the now']),
  },

  // === SPLEEN TO G CENTER (1 channel) ===
  {
    id: '57-10',
    name: 'Perfected Form',
    nameHebrew: 'צורה מושלמת',
    gates: Object.freeze([57, 10] as [number, number]),
    centers: Object.freeze(['spleen', 'g'] as [CenterId, CenterId]),
    circuitry: 'integration',
    keywords: Object.freeze(['intuition', 'behavior', 'survival instinct']),
  },

  // === SACRAL TO THROAT (2 channels) ===
  {
    id: '34-20',
    name: 'Charisma',
    nameHebrew: 'כריזמה',
    gates: Object.freeze([34, 20] as [number, number]),
    centers: Object.freeze(['sacral', 'throat'] as [CenterId, CenterId]),
    circuitry: 'integration',
    keywords: Object.freeze(['power', 'transformation', 'manifesting']),
  },
  {
    id: '34-10',
    name: 'Exploration',
    nameHebrew: 'חקירה',
    gates: Object.freeze([34, 10] as [number, number]),
    centers: Object.freeze(['sacral', 'g'] as [CenterId, CenterId]),
    circuitry: 'integration',
    keywords: Object.freeze(['following conviction', 'behavior', 'power']),
  },

  // === SACRAL TO SPLEEN (4 channels) ===
  {
    id: '27-50',
    name: 'Preservation',
    nameHebrew: 'שימור',
    gates: Object.freeze([27, 50] as [number, number]),
    centers: Object.freeze(['sacral', 'spleen'] as [CenterId, CenterId]),
    circuitry: 'tribal',
    keywords: Object.freeze(['custodianship', 'values', 'responsibility']),
  },
  {
    id: '3-60',
    name: 'Mutation',
    nameHebrew: 'מוטציה',
    gates: Object.freeze([3, 60] as [number, number]),
    centers: Object.freeze(['sacral', 'root'] as [CenterId, CenterId]),
    circuitry: 'individual',
    keywords: Object.freeze(['energy to begin', 'limitation', 'mutation']),
  },
  {
    id: '14-2',
    name: 'The Beat',
    nameHebrew: 'הפעימה',
    gates: Object.freeze([14, 2] as [number, number]),
    centers: Object.freeze(['sacral', 'g'] as [CenterId, CenterId]),
    circuitry: 'individual',
    keywords: Object.freeze(['direction', 'power skills', 'wealth']),
  },
  {
    id: '29-46',
    name: 'Discovery',
    nameHebrew: 'גילוי',
    gates: Object.freeze([29, 46] as [number, number]),
    centers: Object.freeze(['sacral', 'g'] as [CenterId, CenterId]),
    circuitry: 'collective',
    keywords: Object.freeze(['perseverance', 'determination', 'body']),
  },

  // === SACRAL TO SOLAR PLEXUS (2 channels) ===
  {
    id: '59-6',
    name: 'Intimacy',
    nameHebrew: 'אינטימיות',
    gates: Object.freeze([59, 6] as [number, number]),
    centers: Object.freeze(['sacral', 'solar'] as [CenterId, CenterId]),
    circuitry: 'tribal',
    keywords: Object.freeze(['sexuality', 'fertility', 'emotional bonding']),
  },
  {
    id: '42-53',
    name: 'Maturation',
    nameHebrew: 'הבשלה',
    gates: Object.freeze([42, 53] as [number, number]),
    centers: Object.freeze(['sacral', 'root'] as [CenterId, CenterId]),
    circuitry: 'collective',
    keywords: Object.freeze(['growth', 'cycles', 'development']),
  },

  // === SACRAL TO ROOT (3 channels) ===
  {
    id: '5-15',
    name: 'Rhythm',
    nameHebrew: 'קצב',
    gates: Object.freeze([5, 15] as [number, number]),
    centers: Object.freeze(['sacral', 'g'] as [CenterId, CenterId]),
    circuitry: 'collective',
    keywords: Object.freeze(['fixed patterns', 'flow', 'humanity']),
  },
  {
    id: '9-52',
    name: 'Concentration',
    nameHebrew: 'ריכוז',
    gates: Object.freeze([9, 52] as [number, number]),
    centers: Object.freeze(['sacral', 'root'] as [CenterId, CenterId]),
    circuitry: 'collective',
    keywords: Object.freeze(['focus', 'stillness', 'determination']),
  },

  // === SOLAR PLEXUS TO THROAT (2 channels) ===
  {
    id: '35-36',
    name: 'Transitoriness',
    nameHebrew: 'חולף',
    gates: Object.freeze([35, 36] as [number, number]),
    centers: Object.freeze(['throat', 'solar'] as [CenterId, CenterId]),
    circuitry: 'collective',
    keywords: Object.freeze(['change', 'experience', 'emotional depth']),
  },
  {
    id: '12-22',
    name: 'Openness',
    nameHebrew: 'פתיחות',
    gates: Object.freeze([12, 22] as [number, number]),
    centers: Object.freeze(['throat', 'solar'] as [CenterId, CenterId]),
    circuitry: 'individual',
    keywords: Object.freeze(['social expression', 'grace', 'emotional']),
  },

  // === SOLAR PLEXUS TO ROOT (3 channels) ===
  {
    id: '37-40',
    name: 'Community',
    nameHebrew: 'קהילה',
    gates: Object.freeze([37, 40] as [number, number]),
    centers: Object.freeze(['solar', 'heart'] as [CenterId, CenterId]),
    circuitry: 'tribal',
    keywords: Object.freeze(['friendship', 'will', 'bargain']),
  },
  {
    id: '6-59',
    name: 'Mating',
    nameHebrew: 'הזדווגות',
    gates: Object.freeze([6, 59] as [number, number]),
    centers: Object.freeze(['solar', 'sacral'] as [CenterId, CenterId]),
    circuitry: 'tribal',
    keywords: Object.freeze(['reproduction', 'intimacy', 'fertility']),
  },
  {
    id: '49-19',
    name: 'Synthesis',
    nameHebrew: 'סינתזה',
    gates: Object.freeze([49, 19] as [number, number]),
    centers: Object.freeze(['solar', 'root'] as [CenterId, CenterId]),
    circuitry: 'tribal',
    keywords: Object.freeze(['principles', 'wanting', 'revolution']),
  },

  // === ROOT TO SPLEEN (3 channels) ===
  {
    id: '54-32',
    name: 'Transformation',
    nameHebrew: 'טרנספורמציה',
    gates: Object.freeze([54, 32] as [number, number]),
    centers: Object.freeze(['root', 'spleen'] as [CenterId, CenterId]),
    circuitry: 'tribal',
    keywords: Object.freeze(['ambition', 'continuity', 'drive']),
  },
  {
    id: '38-28',
    name: 'Struggle',
    nameHebrew: 'מאבק',
    gates: Object.freeze([38, 28] as [number, number]),
    centers: Object.freeze(['root', 'spleen'] as [CenterId, CenterId]),
    circuitry: 'individual',
    keywords: Object.freeze(['fighter', 'game player', 'purpose']),
  },
  {
    id: '58-18',
    name: 'Judgment',
    nameHebrew: 'שיפוט',
    gates: Object.freeze([58, 18] as [number, number]),
    centers: Object.freeze(['root', 'spleen'] as [CenterId, CenterId]),
    circuitry: 'collective',
    keywords: Object.freeze(['vitality', 'correction', 'challenge']),
  },

  // === ROOT TO SOLAR PLEXUS (1 channel) ===
  {
    id: '39-55',
    name: 'Emoting',
    nameHebrew: 'רגש',
    gates: Object.freeze([39, 55] as [number, number]),
    centers: Object.freeze(['root', 'solar'] as [CenterId, CenterId]),
    circuitry: 'individual',
    keywords: Object.freeze(['provocation', 'spirit', 'moodiness']),
  },

  // === ROOT TO G CENTER (1 channel) ===
  {
    id: '41-30',
    name: 'Recognition',
    nameHebrew: 'הכרה',
    gates: Object.freeze([41, 30] as [number, number]),
    centers: Object.freeze(['root', 'solar'] as [CenterId, CenterId]),
    circuitry: 'collective',
    keywords: Object.freeze(['fantasy', 'feelings', 'desire']),
  },

  // === SPLEEN TO HEART (1 channel) - already included as 26-44 ===
  // (Listed above with Heart to Throat)

  // === Additional channels ===
  {
    id: '48-16',
    name: 'The Wavelength',
    nameHebrew: 'אורך הגל',
    gates: Object.freeze([48, 16] as [number, number]),
    centers: Object.freeze(['spleen', 'throat'] as [CenterId, CenterId]),
    circuitry: 'collective',
    keywords: Object.freeze(['depth', 'skills', 'talent']),
  },
])

/**
 * Get channel by ID (e.g., "1-8" or "64-47")
 */
export function getChannel(id: string): Channel | undefined {
  return CHANNELS.find((channel) => channel.id === id)
}

/**
 * Get channel by gate pair (order doesn't matter)
 */
export function getChannelByGates(gate1: number, gate2: number): Channel | undefined {
  return CHANNELS.find(
    (channel) =>
      (channel.gates[0] === gate1 && channel.gates[1] === gate2) ||
      (channel.gates[0] === gate2 && channel.gates[1] === gate1)
  )
}

/**
 * Get all channels for a specific gate
 */
export function getChannelsForGate(gateNumber: number): readonly Channel[] {
  return CHANNELS.filter(
    (channel) => channel.gates[0] === gateNumber || channel.gates[1] === gateNumber
  )
}

/**
 * Get all channels connecting two specific centers
 */
export function getChannelsBetweenCenters(
  center1: CenterId,
  center2: CenterId
): readonly Channel[] {
  return CHANNELS.filter(
    (channel) =>
      (channel.centers[0] === center1 && channel.centers[1] === center2) ||
      (channel.centers[0] === center2 && channel.centers[1] === center1)
  )
}

/**
 * Get all channels by circuitry type
 */
export function getChannelsByCircuitry(circuitry: Circuitry): readonly Channel[] {
  return CHANNELS.filter((channel) => channel.circuitry === circuitry)
}

/**
 * Find which channels are defined given a set of active gates
 */
export function findDefinedChannels(activeGates: readonly number[]): readonly Channel[] {
  const gateSet = new Set(activeGates)
  return CHANNELS.filter(
    (channel) => gateSet.has(channel.gates[0]) && gateSet.has(channel.gates[1])
  )
}

/**
 * Find potential channels (where one gate is active)
 */
export function findPotentialChannels(
  activeGates: readonly number[]
): readonly { channel: Channel; missingGate: number }[] {
  const gateSet = new Set(activeGates)
  const results: { channel: Channel; missingGate: number }[] = []

  for (const channel of CHANNELS) {
    const hasGate1 = gateSet.has(channel.gates[0])
    const hasGate2 = gateSet.has(channel.gates[1])

    if (hasGate1 && !hasGate2) {
      results.push({ channel, missingGate: channel.gates[1] })
    } else if (!hasGate1 && hasGate2) {
      results.push({ channel, missingGate: channel.gates[0] })
    }
  }

  return results
}

/**
 * Lookup table: gate number -> connecting gates (via channels)
 */
export const GATE_CONNECTIONS: Readonly<Record<number, readonly number[]>> = Object.freeze(
  CHANNELS.reduce(
    (acc, channel) => {
      const [gate1, gate2] = channel.gates

      if (!acc[gate1]) acc[gate1] = []
      if (!acc[gate2]) acc[gate2] = []

      ;(acc[gate1] as number[]).push(gate2)
      ;(acc[gate2] as number[]).push(gate1)

      return acc
    },
    {} as Record<number, number[]>
  )
)

/**
 * Check if two gates are connected by a channel
 */
export function areGatesConnected(gate1: number, gate2: number): boolean {
  return getChannelByGates(gate1, gate2) !== undefined
}
