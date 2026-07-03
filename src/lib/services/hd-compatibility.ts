// Human Design Relationship Compatibility for OmnisX
// Classic HD relationship mechanics across the 36 channels / 64 gates.
//
// Connection classes (per channel = pair of gates):
//   ELECTROMAGNETIC - A has one gate, B has the OTHER gate; together they
//                     complete a channel neither holds alone. Classic attraction.
//   COMPANIONSHIP   - both hold the SAME complete channel. Reinforcing, friendly.
//   DOMINANCE       - one holds the complete channel, the other holds just one
//                     of its gates. The complete-channel person dominates the theme.
//   COMPROMISE      - both hold only one (the SAME) gate of a channel; a hanging
//                     gate each seeks to complete elsewhere.
//
// Pure, deterministic, side-effect free.

import type { Bodygraph, HumanDesignType } from '../types/human-design'
import { TYPE_LABELS, TYPE_LABELS_HEBREW } from '../types/human-design'
import { CHANNELS } from '../data/human-design-channels'
import { calculateBodygraph, isCompleteBodygraph } from '../calculations/human-design'

// ============================================================================
// PUBLIC TYPES
// ============================================================================

export interface HDCompatInput {
  birthDate: string // ISO date string (YYYY-MM-DD)
  birthTime?: string | null // HH:MM, required for HD
  latitude?: number | null
  longitude?: number | null
}

export type HDConnectionType =
  | 'electromagnetic'
  | 'companionship'
  | 'dominance'
  | 'compromise'

export interface HDConnection {
  type: HDConnectionType
  channelId: string
  gates: readonly [number, number]
  description: string
  descriptionHebrew: string
}

export interface HDCompatibility {
  score: number
  connections: HDConnection[]
  type1?: HumanDesignType
  type2?: HumanDesignType
  typeDynamic?: {
    english: string
    hebrew: string
  }
  available: boolean
}

// ============================================================================
// SCORING WEIGHTS
// ============================================================================

const BASE_SCORE = 20

const CONNECTION_SCORE: Readonly<Record<HDConnectionType, number>> = Object.freeze({
  electromagnetic: 12, // highest - the spark of attraction
  companionship: 8, // reinforcing, friendly
  dominance: 3, // mild / contextual
  compromise: 2, // neutral / contextual
})

// ============================================================================
// CONNECTION DESCRIPTIONS (Bilingual)
// ============================================================================

function describeConnection(
  type: HDConnectionType,
  channelName: string,
  channelNameHebrew: string
): { description: string; descriptionHebrew: string } {
  switch (type) {
    case 'electromagnetic':
      return {
        description: `Electromagnetic on ${channelName} - each holds one gate, together completing the channel. Magnetic attraction.`,
        descriptionHebrew: `אלקטרומגנטי ב${channelNameHebrew} - כל אחד מחזיק שער אחד, ויחד משלימים את הערוץ. משיכה מגנטית.`,
      }
    case 'companionship':
      return {
        description: `Companionship on ${channelName} - both share this complete channel. Easy, reinforcing resonance.`,
        descriptionHebrew: `רעות ב${channelNameHebrew} - שניהם חולקים ערוץ שלם זה. תהודה קלה ומחזקת.`,
      }
    case 'dominance':
      return {
        description: `Dominance on ${channelName} - one holds the complete channel, the other only a single gate. That theme is led by the channel-holder.`,
        descriptionHebrew: `דומיננטיות ב${channelNameHebrew} - אחד מחזיק את הערוץ השלם, השני רק שער יחיד. הנושא מובל על ידי בעל הערוץ.`,
      }
    case 'compromise':
      return {
        description: `Compromise on ${channelName} - both hold the same single gate, each seeking completion elsewhere.`,
        descriptionHebrew: `פשרה ב${channelNameHebrew} - שניהם מחזיקים את אותו שער יחיד, וכל אחד מחפש השלמה במקום אחר.`,
      }
  }
}

// ============================================================================
// TYPE DYNAMIC
// ============================================================================

interface TypeDynamicEntry {
  english: string
  hebrew: string
  modifier: number // small score bump for classically smooth pairings
}

/**
 * Order-independent key for a pair of types.
 */
function typePairKey(a: HumanDesignType, b: HumanDesignType): string {
  return [a, b].sort().join('+')
}

const TYPE_DYNAMICS: Readonly<Record<string, TypeDynamicEntry>> = Object.freeze({
  [typePairKey('generator', 'projector')]: {
    english:
      'The Projector guides and directs the Generator’s sustainable life-force energy. A classically complementary pairing.',
    hebrew: 'הפרוג\'קטור מנחה ומכוון את אנרגיית החיים הברה של הג\'נרטור. זוגיות משלימה קלאסית.',
    modifier: 8,
  },
  [typePairKey('manifesting-generator', 'projector')]: {
    english:
      'The Projector channels the Manifesting Generator’s fast, multi-directional energy into focused efficiency.',
    hebrew: 'הפרוג\'קטור ממקד את האנרגיה המהירה ורבת הכיוונים של המניפסטינג ג\'נרטור ליעילות ממוקדת.',
    modifier: 7,
  },
  [typePairKey('generator', 'generator')]: {
    english:
      'Two Generators build a steady, sustainable rhythm together — responding in harmony when both honor their sacral.',
    hebrew: 'שני ג\'נרטורים בונים יחד קצב יציב ובר. הארמוניה כששניהם מכבדים את הסקרל.',
    modifier: 5,
  },
  [typePairKey('generator', 'manifesting-generator')]: {
    english:
      'Both sacral beings respond to life together; the Manifesting Generator adds speed, the Generator adds depth.',
    hebrew: 'שני יצורים סקרליים מגיבים לחיים יחד; המניפסטינג מוסיף מהירות, הג\'נרטור מוסיף עומק.',
    modifier: 4,
  },
  [typePairKey('manifestor', 'projector')]: {
    english:
      'The Manifestor initiates and the Projector guides — powerful when the Manifestor informs and the Projector waits for invitation.',
    hebrew: 'המניפסטור יוזם והפרוג\'קטור מנחה — עוצמתי כשהמניפסטור מיידע והפרוג\'קטור ממתין להזמנה.',
    modifier: 4,
  },
  [typePairKey('reflector', 'reflector')]: {
    english:
      'Two Reflectors — a rare, lunar pairing. Both sample the environment; they need spacious, healthy surroundings to thrive together.',
    hebrew: 'שני רפלקטורים — זוגיות ירחית נדירה. שניהם דוגמים את הסביבה; זקוקים לסביבה בריאה כדי לפרוח יחד.',
    modifier: 2,
  },
})

/**
 * Resolve the type dynamic for a pair, falling back to a generic note.
 */
function getTypeDynamic(t1: HumanDesignType, t2: HumanDesignType): TypeDynamicEntry {
  const known = TYPE_DYNAMICS[typePairKey(t1, t2)]
  if (known) {
    return known
  }

  // Manifestor + anything else => initiating dynamic
  if (t1 === 'manifestor' || t2 === 'manifestor') {
    return {
      english: `An initiating dynamic: the Manifestor brings impact and momentum to the relationship's direction.`,
      hebrew: 'דינמיקה יוזמת: המניפסטור מביא אנרגיה ותנופה לכיוון הקשר.',
      modifier: 2,
    }
  }

  return {
    english: `${TYPE_LABELS[t1]} and ${TYPE_LABELS[t2]} each bring a distinct aura and strategy to the bond.`,
    hebrew: `${TYPE_LABELS_HEBREW[t1]} ו${TYPE_LABELS_HEBREW[t2]} מביאים כל אחד אורה ואסטרטגיה שונה לקשר.`,
    modifier: 0,
  }
}

// ============================================================================
// PER-PERSON CHANNEL STATE
// ============================================================================

type ChannelHold = 'complete' | 'gate0' | 'gate1' | 'none'

/**
 * Determine how a person holds a given channel:
 *  - 'complete' if they have the defined channel (both gates / channel present)
 *  - 'gate0' / 'gate1' if they hold exactly one of the two gates
 *  - 'none' if they hold neither gate
 */
function holdOf(
  bodygraph: Bodygraph,
  channelId: string,
  gate0: number,
  gate1: number,
  completeChannelIds: ReadonlySet<string>,
  gateSet: ReadonlySet<number>
): ChannelHold {
  if (completeChannelIds.has(channelId)) {
    return 'complete'
  }
  const has0 = gateSet.has(gate0)
  const has1 = gateSet.has(gate1)
  // Defensive: if both gates present but channel not in defined list, treat as complete.
  if (has0 && has1) {
    return 'complete'
  }
  if (has0) {
    return 'gate0'
  }
  if (has1) {
    return 'gate1'
  }
  return 'none'
}

// ============================================================================
// MAIN CALCULATION
// ============================================================================

/**
 * Build the HD compatibility input into a complete Bodygraph, or null if the
 * data is insufficient (missing time/location) or the chart is incomplete.
 */
function toBodygraph(input: HDCompatInput): Bodygraph | null {
  if (
    !input.birthTime ||
    input.latitude === null ||
    input.latitude === undefined ||
    input.longitude === null ||
    input.longitude === undefined
  ) {
    return null
  }

  const result = calculateBodygraph({
    birthDate: input.birthDate,
    birthTime: input.birthTime,
    latitude: input.latitude,
    longitude: input.longitude,
  })

  return isCompleteBodygraph(result) ? result : null
}

const UNAVAILABLE: HDCompatibility = Object.freeze({
  score: 0,
  connections: [],
  available: false,
})

/**
 * Calculate Human Design relationship compatibility between two people.
 *
 * Requires an exact birth time AND location for both people; otherwise returns
 * `{ score: 0, connections: [], available: false }` so the caller drops HD
 * from the fused score.
 */
export function calculateHDCompatibility(
  p1: HDCompatInput,
  p2: HDCompatInput
): HDCompatibility {
  const bg1 = toBodygraph(p1)
  const bg2 = toBodygraph(p2)

  if (!bg1 || !bg2) {
    return { ...UNAVAILABLE }
  }

  const gates1 = new Set(bg1.gates)
  const gates2 = new Set(bg2.gates)
  const complete1 = new Set(bg1.channels.map((c) => c.id))
  const complete2 = new Set(bg2.channels.map((c) => c.id))

  const connections: HDConnection[] = []
  let score = BASE_SCORE

  // Walk the full canonical set of 36 channels.
  for (const channel of CHANNELS) {
    const [g0, g1] = channel.gates
    const hold1 = holdOf(bg1, channel.id, g0, g1, complete1, gates1)
    const hold2 = holdOf(bg2, channel.id, g0, g1, complete2, gates2)

    let type: HDConnectionType | null = null

    if (hold1 === 'complete' && hold2 === 'complete') {
      // Both have the same complete channel.
      type = 'companionship'
    } else if (hold1 === 'complete' || hold2 === 'complete') {
      // One has the complete channel. If the other holds a single gate => dominance.
      const otherHold = hold1 === 'complete' ? hold2 : hold1
      if (otherHold === 'gate0' || otherHold === 'gate1') {
        type = 'dominance'
      }
      // other holds 'none' => no resonance on this channel (skip).
    } else {
      // Neither has the complete channel; look at single-gate holdings.
      const single1 = hold1 === 'gate0' || hold1 === 'gate1'
      const single2 = hold2 === 'gate0' || hold2 === 'gate1'
      if (single1 && single2) {
        if (hold1 === hold2) {
          // Both hold the SAME single gate => compromise.
          type = 'compromise'
        } else {
          // Each holds the OTHER gate => electromagnetic.
          type = 'electromagnetic'
        }
      }
    }

    if (type) {
      const desc = describeConnection(type, channel.name, channel.nameHebrew)
      connections.push({
        type,
        channelId: channel.id,
        gates: channel.gates,
        description: desc.description,
        descriptionHebrew: desc.descriptionHebrew,
      })
      score += CONNECTION_SCORE[type]
    }
  }

  // Type dynamic modifier.
  const dynamic = getTypeDynamic(bg1.type, bg2.type)
  score += dynamic.modifier

  score = Math.max(0, Math.min(100, Math.round(score)))

  return {
    score,
    connections,
    type1: bg1.type,
    type2: bg2.type,
    typeDynamic: {
      english: dynamic.english,
      hebrew: dynamic.hebrew,
    },
    available: true,
  }
}
