/**
 * Homepage demo dataset — SIX PEOPLE, EVERYTHING REAL.
 *
 * Every chart and every relationship shown on the homepage is computed here by
 * the actual Pleiad engine at build time (the page revalidates hourly). Nothing
 * on the marketing page is mocked, hand-drawn, or decorative.
 *
 * What the homepage may draw is governed by docs/redesign/CONNECTION_ATLAS.md:
 * a relation earns a line only in proportion to how surprising it is. Ties that
 * fire on nearly every pair (Human Design `electromagnetic` at 95%, astrology
 * cross-aspects at 100%) are true, and they are not findings — they never carry
 * an edge. The map is built from the exact Dreamspell oracle, which fires on
 * 1 pair in 260.
 *
 * If you change a birth date, the ties change. Re-verify before shipping.
 */
import { calculateNatalChart } from '@pleiad/engine/calculations/astrology'
import { calculateBodygraph } from '@pleiad/engine/calculations/human-design'
import { dateToKin, kinToSeal, kinToTone } from '@pleiad/engine/calculations/dreamspell'
import { dateToTzolkin } from '@pleiad/engine/calculations/tzolkin'
import { calculateGematria } from '@pleiad/engine/calculations/gematria'
import { SEALS } from '@pleiad/engine/data/seals'
import { TONES } from '@pleiad/engine/data/tones'
import { getLetterByChar } from '@pleiad/engine/data/hebrew-letters'
import {
  calculateFiveSystemCompatibility,
  CONNECTION_DESCRIPTIONS,
} from '@pleiad/engine/services/compatibility'
import { CONNECTION_SCORE } from '@pleiad/engine/services/hd-compatibility'
import { surprisal, bySurprisal, BASE_RATE, rarityScore, rarityBits } from '@pleiad/engine/services/rarity'
import { buildPenta } from '@pleiad/engine/services/composite-bodygraph'
import type { NatalChart } from '@pleiad/engine/types/astrology'
import type { Bodygraph } from '@pleiad/engine/types/human-design'
import type { TzolkinDay } from '@pleiad/engine/types/tzolkin'
import type { GematriaResult } from '@pleiad/engine/types/gematria'
import type { SystemKey } from '@/lib/design/system-flavors'

export interface DemoPerson {
  readonly id: string
  readonly name: string
  readonly birthDate: string
  readonly birthTime: string
  readonly lat: number
  readonly lng: number
  readonly hebrewName: string
  /** Where the node sits on the map canvas (viewBox 0 0 800 460). */
  readonly x: number
  readonly y: number
}

/**
 * The roster. Maya is the ego; the other five are her EXACT oracle.
 *
 * "Exact" is load-bearing. An oracle relation requires the paired seal AND the
 * tone — a 1-in-260 event, not 1-in-20 (see CONNECTION_ATLAS.md §3). These five
 * birth dates were searched to produce genuine kin-level relations against
 * Maya's kin 60 (seal 20 Sun, tone 8):
 *
 *   Ari   1983-08-25  kin 164  seal 4  tone 8   → GUIDE     (seal = guide(20,8), tone matches)
 *   Noam  1987-01-12  kin  99  seal 19 tone 8   → ANALOG    (20 + 19 = 19 mod 20; tone matches)
 *   Tal   1985-02-22  kin 190  seal 10 tone 8   → ANTIPODE  (seal = 20+10 mod 20, tone matches)
 *   Omer  1984-06-18  kin 201                   → OCCULT    (60 + 201 = 261)
 *   Dana  1994-06-27  kin 220  seal 20 tone 12  → SAME-SEAL (same seal, different tone)
 *
 * Change any of these and the oracle breaks — buildEgoStar throws rather than
 * draw a spoke the engine did not find. That throw is the design working.
 */
export const DEMO_PEOPLE: readonly DemoPerson[] = Object.freeze([
  { id: 'maya', name: 'Maya', birthDate: '1991-03-14', birthTime: '08:20', lat: 32.08, lng: 34.78, hebrewName: 'מאיה', x: 180, y: 110 },
  { id: 'noam', name: 'Noam', birthDate: '1987-01-12', birthTime: '14:05', lat: 31.77, lng: 35.21, hebrewName: 'נועם', x: 420, y: 80 },
  { id: 'dana', name: 'Dana', birthDate: '1994-06-27', birthTime: '21:40', lat: 32.79, lng: 34.99, hebrewName: 'דנה', x: 610, y: 170 },
  { id: 'ari', name: 'Ari', birthDate: '1983-08-25', birthTime: '05:55', lat: 31.25, lng: 34.79, hebrewName: 'ארי', x: 250, y: 300 },
  { id: 'tal', name: 'Tal', birthDate: '1985-02-22', birthTime: '17:30', lat: 32.17, lng: 34.84, hebrewName: 'טל', x: 480, y: 330 },
  { id: 'omer', name: 'Omer', birthDate: '1984-06-18', birthTime: '11:10', lat: 29.55, lng: 34.95, hebrewName: 'עומר', x: 660, y: 380 },
])

/** A single named tie between two people, in the engine's own vocabulary. */
export interface DemoTie {
  readonly system: SystemKey
  readonly from: string
  readonly to: string
  /** The engine's type name, verbatim: 'guide' | 'electromagnetic' | 'trine' … */
  readonly type: string
  /** Plain-English meaning, sourced from the engine's own description. */
  readonly meaning: string
  readonly harmony: 'supportive' | 'challenging' | 'transformative' | 'neutral'
  readonly score: number
  /**
   * Bits of information this tie carries — −log₂(its measured base rate).
   * A `guide` (0.38% of pairs) is 8.0 bits. An `electromagnetic` (95.4%) is
   * 0.07 bits. This, not the tradition's constants, is what ranks the map.
   */
  readonly bits: number
  /** Measured share of random pairs that have this tie at all. */
  readonly baseRate: number
  /** Human Design only — the channel they complete, e.g. "34-57" and its gates. */
  readonly channel?: string
  /** Astrology only — the two planets forming the aspect, e.g. Moon → Sun. */
  readonly planets?: readonly [string, string]
}

/** The engine's five compat system keys. */
export type CompatSystemKey = 'astrology' | 'dreamspell' | 'tzolkin' | 'humanDesign' | 'gematria'

export interface DemoPair {
  readonly a: string
  readonly b: string
  readonly overall: number
  /**
   * How UNUSUAL this pairing is, 0-100, from the information content of its
   * ties. Explicitly not "how good": nothing in any of these traditions
   * licenses "good". See packages/engine/src/services/rarity.ts.
   */
  readonly rarity: number
  /** Total bits of information in this pair's ties. */
  readonly bits: number
  readonly ties: readonly DemoTie[]
  /** Real per-system score (0-100) for this pair. */
  readonly systems: Readonly<Record<CompatSystemKey, number>>
}

/** Per-person five-system chart payloads for the map gallery. */
export interface DemoCharts {
  readonly natal: NatalChart
  /** Always a full Bodygraph — every demo person has a birth time. */
  readonly bodygraph: Bodygraph
  readonly kin: number
  readonly seal: number
  readonly tone: number
  readonly tzolkin: TzolkinDay
  readonly gematria: GematriaResult
  /** Standard-method letter value of the Hebrew name. */
  readonly gematriaValue: number
}

const HARMONY_BY_HD: Record<string, DemoTie['harmony']> = {
  electromagnetic: 'transformative',
  companionship: 'supportive',
  dominance: 'neutral',
  compromise: 'challenging',
}

const HD_MEANING: Record<string, string> = {
  electromagnetic: 'Each holds one gate of the same channel — they complete each other.',
  companionship: 'Both carry the whole channel. Reinforcing, easy company.',
  dominance: 'One carries the full channel, the other a single gate.',
  compromise: 'Both hold the same single gate, and neither closes it.',
}

/** Synastry aspect base scores, mirroring MAJOR_ASPECTS in services/synastry.ts. */
const ASPECT_SCORE: Record<string, number> = {
  conjunction: 10,
  trine: 10,
  sextile: 6,
  square: 4,
  opposition: 4,
}

/**
 * Tzolkin-only connection types (`same-sign`, `trecena-match`) that don't appear
 * in the shared dreamspell table. Ranked below a same-seal (25) match.
 */
const TZOLKIN_FALLBACK_SCORE: Record<string, number> = {
  'same-sign': 20,
  'trecena-match': 12,
}

/**
 * Rank ties by how much they actually SAY — their surprisal, measured by the
 * engine over thousands of random pairs (packages/engine/src/services/rarity.ts).
 *
 * This replaces a hand-written "interest" table. Hand-ranking was the same
 * mistake the traditions make: asserting that a `guide` is worth 18 and an
 * `electromagnetic` 12, when in fact a guide occurs between 0.4% of people and
 * an electromagnetic between 95% of them. The information content settles it —
 * and it does so without anyone's opinion.
 */
export function byInterest(a: DemoTie, b: DemoTie): number {
  return bySurprisal(a, b) || b.score - a.score
}

/** Astrologers say "is conjunct", not "conjunctions". */
const ASPECT_VERB: Record<string, string> = {
  conjunction: 'is conjunct',
  opposition: 'opposes',
  trine: 'trines',
  square: 'squares',
  sextile: 'sextiles',
}

/** The engine prefixes descriptions with "Guide - …"; keep only the meaning. */
const stripLabel = (s: string): string => s.replace(/^[^-]+-\s*/, '')

/** The engine's centre ids are lowercase slugs; humans read names. */
const CENTER_NAME: Record<string, string> = {
  head: 'Head',
  ajna: 'Ajna',
  throat: 'Throat',
  g: 'G Centre',
  heart: 'Heart',
  sacral: 'Sacral',
  spleen: 'Spleen',
  solarPlexus: 'Solar Plexus',
  'solar-plexus': 'Solar Plexus',
  root: 'Root',
}
const centerName = (id: string): string => CENTER_NAME[id] ?? id

/** Stamp a tie with what it actually tells you. Every tie goes through here. */
const tie = (t: Omit<DemoTie, 'bits' | 'baseRate'>): DemoTie => ({
  ...t,
  bits: surprisal(t.type),
  baseRate: BASE_RATE[t.type] ?? 0.5,
})

/** Compute the full demo dataset. Server-only; called from the page (RSC). */
export function buildHomepageDemo(): {
  people: readonly DemoPerson[]
  charts: Record<string, DemoCharts>
  pairs: readonly DemoPair[]
} {
  const charts: Record<string, DemoCharts> = {}

  for (const p of DEMO_PEOPLE) {
    const kin = dateToKin(p.birthDate)
    const gematria = calculateGematria(p.hebrewName)

    // Every demo person has a birth time, so this is always a full Bodygraph.
    const hd = calculateBodygraph({ birthDate: p.birthDate, birthTime: p.birthTime, latitude: p.lat, longitude: p.lng })
    if (!('hasBirthTime' in hd) || hd.hasBirthTime !== true) {
      throw new Error(`Demo person ${p.id} produced a partial bodygraph — birth time is required.`)
    }

    charts[p.id] = {
      natal: calculateNatalChart({ date: p.birthDate, time: p.birthTime, latitude: p.lat, longitude: p.lng }),
      bodygraph: hd,
      kin,
      seal: kinToSeal(kin),
      tone: kinToTone(kin),
      tzolkin: dateToTzolkin(p.birthDate),
      gematria,
      gematriaValue: gematria.methods.standard.value,
    }
  }

  const pairs: DemoPair[] = []

  for (let i = 0; i < DEMO_PEOPLE.length; i++) {
    for (let j = i + 1; j < DEMO_PEOPLE.length; j++) {
      const a = DEMO_PEOPLE[i]
      const b = DEMO_PEOPLE[j]
      const r = calculateFiveSystemCompatibility(
        { birthDate: a.birthDate, birthTime: a.birthTime, birthPlace: { lat: a.lat, lng: a.lng }, hebrewName: a.hebrewName, name: a.name },
        { birthDate: b.birthDate, birthTime: b.birthTime, birthPlace: { lat: b.lat, lng: b.lng }, hebrewName: b.hebrewName, name: b.name },
      )

      const ties: DemoTie[] = []

      // Dreamspell — description/harmony from the engine, score from its own table.
      for (const c of r.dreamspellDetail?.connections ?? []) {
        ties.push(tie({
          system: 'dreamspell',
          from: a.id,
          to: b.id,
          type: c.type,
          meaning: stripLabel(c.description),
          harmony: c.harmony,
          score: CONNECTION_DESCRIPTIONS[c.type]?.score ?? 0,
        }))
      }

      // Tzolkin — its connections carry no harmony/score; map from the shared table.
      for (const c of r.tzolkinDetail?.connections ?? []) {
        const known = CONNECTION_DESCRIPTIONS[c.type as keyof typeof CONNECTION_DESCRIPTIONS]
        ties.push(tie({
          system: 'tzolkin',
          from: a.id,
          to: b.id,
          type: c.type,
          meaning: stripLabel(c.description),
          harmony: known?.harmony ?? 'supportive',
          score: known?.score ?? TZOLKIN_FALLBACK_SCORE[c.type] ?? 0,
        }))
      }

      // ======================================================================
      // HUMAN DESIGN — the findings, not the noise.
      //
      // The four channel connections are canonical and nearly useless as
      // findings: electromagnetic fires on 95.4% of random pairs, dominance on
      // 96.3%, compromise on 96.0%. What actually discriminates is what the two
      // of them BUILD: centres defined between them that neither has alone (the
      // third entity), one closing the other's split, and the count — never the
      // existence. See CONNECTION_ATLAS.md §5.
      // ======================================================================
      const rel = r.hdDetail?.relation
      if (rel) {
        for (const center of rel.emergentCenters) {
          ties.push(tie({
            system: 'humanDesign',
            from: a.id,
            to: b.id,
            type: 'emergent-center',
            meaning: `Together they define the ${centerName(center)} — a centre neither of them has alone.`,
            harmony: 'transformative',
            score: rel.definedCenterCount,
            channel: center,
          }))
        }

        if (rel.splitBridge) {
          const who = rel.splitBridge.bridged === 'person1' ? a : b
          const other = rel.splitBridge.bridged === 'person1' ? b : a
          ties.push(tie({
            system: 'humanDesign',
            from: other.id,
            to: who.id, // DIRECTED: the bridge runs one way
            type: 'split-bridge',
            meaning: `${other.name} closes ${who.name}'s split — in their presence it reads as one piece.`,
            harmony: 'transformative',
            score: rel.splitBridge.islandsAlone,
          }))
        }

        // Companionship is the one channel type that isn't near-universal (32%).
        const comp = r.hdDetail?.connections.find((c) => c.type === 'companionship')
        if (comp) {
          ties.push(tie({
            system: 'humanDesign',
            from: a.id,
            to: b.id,
            type: 'companionship',
            meaning: HD_MEANING.companionship,
            harmony: 'supportive',
            score: rel.counts.companionship,
            channel: comp.channelId,
          }))
        }

        // Electromagnetic is kept ONLY as a count, and it is worth 0.07 bits.
        // It stays in the data because it is true; it can never lead the map.
        if (rel.counts.electromagnetic > 0) {
          const em = r.hdDetail?.connections.find((c) => c.type === 'electromagnetic')
          ties.push(tie({
            system: 'humanDesign',
            from: a.id,
            to: b.id,
            type: 'electromagnetic',
            meaning: `${rel.counts.electromagnetic} channels completed only by the two of them. (So do 95% of pairs — it's the count and the channel that matter.)`,
            harmony: 'transformative',
            score: rel.counts.electromagnetic,
            channel: em?.channelId,
          }))
        }
      }

      // ======================================================================
      // ASTROLOGY — the discriminators only.
      //
      // A cross-aspect fires between 100% of random pairs: with standard orbs
      // any planet pair is in aspect ~27% of the time, so ~27 aspects exist
      // between ANY two charts. Drawing those was the original hairball.
      //
      // `discriminators` is synastry's own T2/T3 list — double whammies (~7%),
      // ≤1° contacts, Vertex hits (~8.5%), nodal-axis integration (~7%),
      // stellium overlays (~4%). Anything needing a birth time or place is
      // suppressed when that data is absent, never defaulted.
      // See docs/redesign/CONNECTION_ATLAS.md §2.
      // ======================================================================
      // The canonical double whammies (Sun–Moon, Venus–Mars) are a different
      // animal from the generic one: measured 9.4% and 9.1% against 73.6% for
      // "any planet pair reciprocates". Name them apart so surprisal can tell
      // them apart.
      const CORE_WHAMMY = new Set(['sun|moon', 'mars|venus'])
      for (const c of r.synastryDetail?.discriminators ?? []) {
        const pairKey = [c.planet1, c.planet2].filter(Boolean).sort().join('|')
        const type =
          c.type === 'double-whammy' && CORE_WHAMMY.has(pairKey)
            ? 'double-whammy-core'
            : c.type
        ties.push(tie({
          system: 'astrology',
          from: a.id,
          to: b.id,
          type,
          meaning: c.description ?? c.type.replace(/-/g, ' '),
          harmony: c.harmony === 'challenging' ? 'challenging' : 'supportive',
          // Tightness IS the signal in astrology — score by closeness to exact.
          score: c.orb !== null ? Math.round((1 - Math.min(c.orb, 8) / 8) * 100) : 50,
          planets: c.planet1 && c.planet2 ? [c.planet1, c.planet2] : undefined,
        }))
      }

      // Gematria's ONLY sanctioned pair relation: the two names carry the exact
      // same value. Rare, and therefore worth drawing. The old `name-resonance`
      // tie fired on every pair and was invented arithmetic — see
      // docs/redesign/CONNECTION_ATLAS.md §6.
      if (r.nameMatch?.exact) {
        ties.push(tie({
          system: 'gematria',
          from: a.id,
          to: b.id,
          type: 'name-value-match',
          meaning: `Both names carry the value ${r.nameMatch.value1}.`,
          harmony: 'supportive',
          score: r.nameMatch.value1,
        }))
      }

      pairs.push({
        rarity: rarityScore(ties),
        bits: Math.round(rarityBits(ties) * 10) / 10,
        a: a.id,
        b: b.id,
        overall: r.overallScore,
        ties,
        systems: {
          astrology: r.systems.astrology?.score ?? 0,
          dreamspell: r.systems.dreamspell?.score ?? 0,
          tzolkin: r.systems.tzolkin?.score ?? 0,
          humanDesign: r.systems.humanDesign?.score ?? 0,
          gematria: r.systems.gematria?.score ?? 0,
        },
      })
    }
  }

  return { people: DEMO_PEOPLE, charts, pairs }
}

/**
 * How many ties we lead with. WHICH ties is not ours to choose — see
 * buildCallouts: they are the most informative ones the engine found, ranked by
 * surprisal. A hardcoded list went stale the moment a birth date changed (it
 * still named a `noam↔omer occult` that no longer exists), and worse, it let a
 * human decide what was interesting when the base rates already know.
 */
const CALLOUT_COUNT = 4

export interface DemoCallout {
  readonly tie: DemoTie
  readonly from: DemoPerson
  readonly to: DemoPerson
  readonly headline: string
}

/** Turn a computed tie into a sentence. The sentence is derived, never authored. */
function headlineFor(tie: DemoTie, from: DemoPerson, to: DemoPerson): string {
  switch (tie.type) {
    case 'guide':
      return `${from.name} is ${to.name}'s Guide.`
    case 'antipode':
      return `${from.name} is ${to.name}'s Antipode.`
    case 'occult':
      return `${from.name} and ${to.name} are an Occult pair.`
    case 'analog':
      return `${from.name} and ${to.name} are Analogs.`
    case 'electromagnetic':
      return `${from.name} and ${to.name} complete channel ${tie.channel}.`
    case 'companionship':
      return `${from.name} and ${to.name} both carry channel ${tie.channel}.`
    default:
      if (tie.planets) {
        const [p1, p2] = tie.planets
        const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
        const verb = ASPECT_VERB[tie.type] ?? `is ${tie.type} to`
        return `${from.name}'s ${cap(p1)} ${verb} ${to.name}'s ${cap(p2)}.`
      }
      return `${from.name} and ${to.name}: ${tie.type.replace(/-/g, ' ')}.`
  }
}

/** Dreamspell seal-family colors, for the node discs. */
const SEAL_COLOR: Record<string, string> = {
  red: '#C0392B',
  white: '#ECF0F1',
  blue: '#2C3E90',
  yellow: '#F1C40F',
}

// ---------------------------------------------------------------------------
// THE EGO STAR — the hero map.
//
// Why a star and not a network: across six people the engine finds 15 pairs,
// and most tie types fire on nearly all of them. `electromagnetic` matched
// 15/15 pairs; so did the major astrology aspects, `dominance`, `compromise`,
// and `name-resonance`. Two full bodygraphs almost always share one gate of
// some channel, and two full natal charts always trine *something*. Those ties
// are true, and they are worthless as a picture — a complete graph where the
// existence of a line carries no information.
//
// The Dreamspell kin relations are the layer that actually discriminates:
// `guide` fired on 1 pair, `occult` on 1, `same-seal` on 1, `antipode` on 2.
// So the hero map is one person's five kin relations — each spoke a different
// named relation, no repeats, no filler. It is the Dreamspell oracle, drawn
// from real birth dates.
// ---------------------------------------------------------------------------

/** The person at the center of the hero map. */
const EGO_ID = 'maya'

/**
 * WHERE A PERSON SITS IS NOT A DESIGN CHOICE — IT IS THE ORACLE.
 *
 * Dreamspell lays every kin out as a cross around a center: the guide above,
 * the analog to the right, the antipode to the left, the occult below. This app
 * already draws it that way for a single person (see components/cards/OracleMap
 * .tsx). The hero map is that same cross, except each arm is a *person* rather
 * than a seal — so position carries the relation, exactly as it does in the
 * oracle, and a reader who learns the shape once can read any map.
 *
 * `same-seal` has no arm: someone who shares your seal *is* your center sign.
 * They orbit the middle on the diagonal instead, drawn dashed — inside the
 * oracle's essence, outside its cross.
 */
const ORACLE_SLOT = Object.freeze({
  guide: 'top',
  analog: 'right',
  antipode: 'left',
  occult: 'bottom',
  'same-seal': 'orbit',
} as const)

export type OracleSlot = (typeof ORACLE_SLOT)[keyof typeof ORACLE_SLOT]

/** The relations the hero map can draw, in oracle-cross order. */
const KIN_RELATION_ORDER = Object.keys(ORACLE_SLOT) as readonly (keyof typeof ORACLE_SLOT)[]

export interface EgoSpoke {
  readonly person: DemoPerson
  /** The kin relation itself — engine-computed, never assumed. */
  readonly tie: DemoTie
  /** Where the oracle puts this relation. Not a layout preference. */
  readonly slot: OracleSlot
  /** Fused four-system score for the pair. */
  readonly overall: number
  /** How unusual this pairing is (information content), 0-100. */
  readonly rarity: number
  /**
   * The most telling tie *each* system found with this person — the map's
   * layers. A system is absent from this record when it found nothing between
   * these two, and then that layer simply has no strand for them. That absence
   * is a result, not a gap to fill.
   */
  readonly bySystem: Partial<Record<SystemKey, DemoTie>>
  /** Real per-system score (0–100), so a consolidated view can re-fuse honestly. */
  readonly systems: Readonly<Record<CompatSystemKey, number>>
  readonly color: string
  readonly kin: number
  readonly seal: number
  /** The seal's English name, e.g. "Sun" — shown under the glyph. */
  readonly sealName: string
  readonly tone: number
  readonly reading: readonly [string, string, string, string, string]
}

export interface EgoStarData {
  readonly center: {
    readonly person: DemoPerson
    readonly color: string
    readonly kin: number
    readonly seal: number
    readonly sealName: string
    readonly tone: number
    readonly reading: readonly [string, string, string, string, string]
  }
  readonly spokes: readonly EgoSpoke[]
}

/** The five-system one-liner for a person. Every field is off the real chart. */
function readingFor(c: DemoCharts): readonly [string, string, string, string, string] {
  const seal = SEALS[c.seal - 1]
  return [
    `${c.natal.sunSign.name} · ${c.natal.moonSign.name} moon`,
    `Kin ${c.kin} ${seal?.english ?? ''}`.trim(),
    `${c.tzolkin.daySign.yucatec} ${c.tzolkin.tone}`,
    `${c.bodygraph.type} ${c.bodygraph.profile.id}`,
    `${c.gematria.text} · ${c.gematriaValue}`,
  ]
}

const sealColor = (c: DemoCharts): string =>
  SEAL_COLOR[SEALS[c.seal - 1]?.color ?? 'white'] ?? '#ECF0F1'

/**
 * Build the hero star: the ego and their five kin relations.
 *
 * Throws if the roster does not actually produce five *distinct* kin relations
 * from the center person. That is deliberate — an empty or duplicated spoke
 * would mean drawing a line the engine never found, and the whole point of this
 * page is that it draws nothing it cannot compute. If this throws, fix the
 * birth dates, not this function.
 */
export function buildEgoStar(
  people: readonly DemoPerson[],
  charts: Record<string, DemoCharts>,
  pairs: readonly DemoPair[],
): EgoStarData {
  const ego = people.find((p) => p.id === EGO_ID)
  if (!ego) throw new Error(`Ego star: no demo person with id "${EGO_ID}".`)

  const wanted = new Set<string>(KIN_RELATION_ORDER)

  // One kin relation per peer — the most telling one the engine found.
  const found = people
    .filter((p) => p.id !== ego.id)
    .map((person) => {
      const pair = pairs.find(
        (x) =>
          (x.a === ego.id && x.b === person.id) || (x.a === person.id && x.b === ego.id),
      )
      const tie = [...(pair?.ties ?? [])].filter((t) => wanted.has(t.type)).sort(byInterest)[0]
      if (!pair || !tie) {
        throw new Error(
          `Ego star: the engine found no kin relation between ${ego.name} and ${person.name}. ` +
            `Re-pick ${person.name}'s birth date — do not draw an unnamed spoke.`,
        )
      }

      // The strongest thing each system has to say about this pair — one strand
      // per layer. Systems that found nothing are simply left out.
      const bySystem: Partial<Record<SystemKey, DemoTie>> = {}
      for (const t of [...pair.ties].sort(byInterest)) {
        if (!bySystem[t.system]) bySystem[t.system] = t
      }

      return { person, tie, overall: pair.overall, rarity: pair.rarity, bySystem, systems: pair.systems }
    })

  const types = new Set(found.map((s) => s.tie.type))
  if (types.size !== found.length) {
    throw new Error(
      `Ego star: two peers share the same kin relation (${[...types].join(', ')}). ` +
        `Each arm of the oracle must be a different relation — re-pick a birth date.`,
    )
  }

  const spokes: EgoSpoke[] = [...found]
    .sort(
      (a, b) =>
        KIN_RELATION_ORDER.indexOf(a.tie.type as keyof typeof ORACLE_SLOT) -
        KIN_RELATION_ORDER.indexOf(b.tie.type as keyof typeof ORACLE_SLOT),
    )
    .map((s) => {
      const c = charts[s.person.id]
      return {
        person: s.person,
        tie: s.tie,
        slot: ORACLE_SLOT[s.tie.type as keyof typeof ORACLE_SLOT],
        overall: s.overall,
        rarity: s.rarity,
        bySystem: s.bySystem,
        systems: s.systems,
        color: sealColor(c),
        kin: c.kin,
        seal: c.seal,
        sealName: SEALS[c.seal - 1]?.english ?? '',
        tone: c.tone,
        reading: readingFor(c),
      }
    })

  const c = charts[ego.id]
  return {
    center: {
      person: ego,
      color: sealColor(c),
      kin: c.kin,
      seal: c.seal,
      sealName: SEALS[c.seal - 1]?.english ?? '',
      tone: c.tone,
      reading: readingFor(c),
    },
    spokes,
  }
}

// ---------------------------------------------------------------------------
// THE REST OF THE PAGE — §3 reading, §4 pair scores, §5 library.
//
// These three surfaces used to be hand-written, and they contradicted the
// engine: §3 called the ego "Kin 113 · Solar Skywalker" (she is kin 60, Sun),
// §4 labelled her tie to Ari "Occult partners" (the engine says `guide`; the
// occult partner is Omer), and §5 invented surnames and readings. A homepage
// that argues with its own product is worse than a blank one. All three are
// now computed from the same charts the hero draws.
// ---------------------------------------------------------------------------

/** Asset filenames are `NN-slug.svg`, keyed by the datum's own number. */
const iconSlug = (n: number, name: string): string =>
  `${String(n).padStart(2, '0')}-${name.toLowerCase().replace(/[^a-z]/g, '')}`

export interface ReadingTabData {
  readonly key: SystemKey
  readonly title: string
  readonly value: string
  readonly detail: string
  readonly icon: string
}

/** §3 — the ego's real five-system reading. */
export function buildReadingTabs(charts: Record<string, DemoCharts>): readonly ReadingTabData[] {
  const c = charts[EGO_ID]
  const seal = SEALS[c.seal - 1]
  const tone = TONES[c.tone - 1]
  const sun = c.natal.sunSign
  const asc = c.natal.ascendant
  const hd = c.bodygraph
  const day = c.tzolkin.daySign
  const firstLetter = getLetterByChar([...c.gematria.text].find((ch) => getLetterByChar(ch)) ?? 'א')

  return [
    {
      key: 'astrology',
      title: 'Natal chart',
      value: `Sun in ${sun.name} · Moon in ${c.natal.moonSign.name}`,
      detail: `${asc ? `Rising ${asc.sign.name} — ` : ''}${c.natal.planets.length} placements, ${c.natal.aspects.length} aspects`,
      icon: `/images/astrology/signs/${iconSlug(sun.number, sun.name)}.svg`,
    },
    {
      key: 'dreamspell',
      title: 'Galactic signature',
      value: `Kin ${c.kin} · ${tone?.name ?? ''} ${seal?.english ?? ''}`.trim(),
      detail: `${seal?.color ?? ''} ${seal?.english ?? ''}, tone ${c.tone}`.trim(),
      icon: `/images/dreamspell/seals/${iconSlug(seal?.number ?? 1, seal?.english ?? 'dragon')}.svg`,
    },
    {
      key: 'tzolkin',
      title: 'Day sign',
      value: `${day.yucatec} · ${c.tzolkin.tone}`,
      detail: day.english,
      icon: `/icons/tzolkin/signs/${iconSlug(day.number, day.yucatec)}.svg`,
    },
    {
      key: 'humanDesign',
      title: 'Bodygraph',
      value: `${hd.type} ${hd.profile.id}`,
      detail: `${hd.authority} authority — ${hd.channels.length} channels defined`,
      icon: '/images/human-design/bodygraph/bodygraph.svg',
    },
    {
      key: 'gematria',
      title: 'Name value',
      value: `${c.gematria.text} — ${c.gematriaValue}`,
      detail: `${c.gematria.letterCount} letters, opening with ${firstLetter?.name ?? ''}`,
      icon: `/images/gematria/letters/${iconSlug(firstLetter?.number ?? 1, firstLetter?.id ?? 'aleph')}.svg`,
    },
  ]
}

export interface PairScoreRow {
  readonly key: SystemKey
  readonly score: number
  /** The engine's own name for the strongest tie this system found. */
  readonly note: string
}

export interface PairScoresData {
  readonly a: DemoPerson
  readonly b: DemoPerson
  readonly rows: readonly PairScoreRow[]
}

/** The pair §4 puts under the microscope: the ego and her guide. */
const FEATURED_PAIR: readonly [string, string] = [EGO_ID, 'ari']

/** §4 — one pair, five real per-system scores, each annotated by its own top tie. */
export function buildPairScores(
  people: readonly DemoPerson[],
  pairs: readonly DemoPair[],
  order: readonly SystemKey[],
): PairScoresData {
  const [aId, bId] = FEATURED_PAIR
  const pair = pairs.find(
    (p) => (p.a === aId && p.b === bId) || (p.a === bId && p.b === aId),
  )
  if (!pair) throw new Error(`Pair scores: the engine produced no pair for ${aId}/${bId}.`)

  const person = (id: string) => people.find((p) => p.id === id)!

  const rows = order.map((key) => {
    const top = [...pair.ties].filter((t) => t.system === key).sort(byInterest)[0]
    return {
      key,
      score: Math.round(pair.systems[key as CompatSystemKey] ?? 0),
      // Name the tie and let it speak; never invent a flavor line.
      note: top ? `${top.type.replace(/-/g, ' ')}${top.channel ? ` ${top.channel}` : ''}` : 'no tie found',
    }
  })

  return { a: person(aId), b: person(bId), rows }
}

export interface LibraryPerson {
  readonly name: string
  /** Kin, sun sign, and Human Design type — the line the app itself shows. */
  readonly meta: string
}

/** §5 — the library rows, from the same people the hero draws. */
export function buildLibraryPeople(
  people: readonly DemoPerson[],
  charts: Record<string, DemoCharts>,
): readonly LibraryPerson[] {
  return people.map((p) => {
    const c = charts[p.id]
    return {
      name: p.name,
      meta: `Kin ${c.kin} · ${c.natal.sunSign.name} · ${c.bodygraph.type} ${c.bodygraph.profile.id}`,
    }
  })
}

/**
 * Build the five acetate layers for the scroll set-piece — one edge list per
 * system, in FLAVOR_DESCENT order. Every edge is a real tie; if a system found
 * no tie between two people, there is no line. We keep the strongest few per
 * layer so the canvas stays readable.
 */
export function buildLayerEdges(
  people: readonly DemoPerson[],
  pairs: readonly DemoPair[],
  order: readonly SystemKey[],
  maxPerLayer = 4,
): readonly (readonly { x1: number; y1: number; x2: number; y2: number; type: string }[])[] {
  const byId = (id: string) => people.find((p) => p.id === id)!

  return order.map((system) => {
    const edges = pairs
      .flatMap((pair) => pair.ties.filter((t) => t.system === system))
      // Strongest ties first, so the layer shows its most meaningful links.
      .sort((a, b) => b.score - a.score)

    // One line per person-pair — don't stack duplicates on the same segment.
    const seen = new Set<string>()
    const picked: { x1: number; y1: number; x2: number; y2: number; type: string }[] = []

    for (const t of edges) {
      const key = [t.from, t.to].sort().join('|')
      if (seen.has(key)) continue
      seen.add(key)
      const a = byId(t.from)
      const b = byId(t.to)
      picked.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y, type: t.type })
      if (picked.length >= maxPerLayer) break
    }

    return picked
  })
}

/** Build the featured callouts for the homepage §4, from real computed pairs. */
/**
 * The headline ties — chosen by information content, not by hand.
 *
 * Every tie in the dataset is ranked by surprisal (−log₂ of its measured base
 * rate), and we take the most informative ones, at most one per pair so a
 * single dense pairing can't hog the section. A tie that fires between 95% of
 * humans can never win this contest, which is the entire point.
 */
export function buildCallouts(
  people: readonly DemoPerson[],
  pairs: readonly DemoPair[],
): readonly DemoCallout[] {
  const byId = (id: string) => people.find((p) => p.id === id)!

  const seenPairs = new Set<string>()
  const out: DemoCallout[] = []

  const ranked = pairs
    .flatMap((p) => p.ties.map((t) => ({ tie: t, key: [p.a, p.b].sort().join('|') })))
    .sort((x, y) => bySurprisal(x.tie, y.tie))

  for (const { tie: t, key } of ranked) {
    if (out.length >= CALLOUT_COUNT) break
    if (seenPairs.has(key)) continue
    seenPairs.add(key)
    out.push({
      tie: t,
      from: byId(t.from),
      to: byId(t.to),
      headline: headlineFor(t, byId(t.from), byId(t.to)),
    })
  }

  return out
}


// ---------------------------------------------------------------------------
// CIRCLES — groups, read by the Penta.
//
// Ra: "when three people gather in a room, their auras morph into a Pentic
// aura, and the Pentic aura dominates." The Penta is the canonical form for
// 3-5 people, and `buildPenta` has been in this engine, tested, calling nobody.
//
// This section previously listed invented members ("Shai", "Lior" — not in the
// roster) with invented insights ("Maya bridges — the only defined throat in
// the room"). Now the members are real people and the insight is whatever the
// group actually defines that no member defines alone.
// ---------------------------------------------------------------------------

export interface DemoCircle {
  readonly name: string
  readonly accent: string
  readonly members: readonly DemoPerson[]
  /** Centres the group defines that NO single member has. Computed, not written. */
  readonly emergentCenters: readonly string[]
  readonly insight: string
}

const CIRCLE_DEFS: readonly { name: string; accent: string; ids: readonly string[] }[] = [
  { name: 'Family', accent: '#7D5BC9', ids: ['maya', 'noam', 'dana'] },
  { name: 'Team', accent: '#7FD4C1', ids: ['maya', 'ari', 'tal', 'omer'] },
  { name: 'Friends', accent: '#B387E8', ids: ['maya', 'omer', 'dana'] },
]

export function buildCircles(
  people: readonly DemoPerson[],
  charts: Record<string, DemoCharts>,
): readonly DemoCircle[] {
  return CIRCLE_DEFS.map(({ name, accent, ids }) => {
    const members = ids.map((id) => people.find((p) => p.id === id)!)
    const penta = buildPenta(members.map((m) => charts[m.id].bodygraph))

    const emergent = [...penta.emergentCenters]
    const names = members.map((m) => m.name)
    const insight =
      emergent.length > 0
        ? `Together they define the ${emergent.map(centerName).join(', ')} — ${emergent.length === 1 ? 'a centre' : 'centres'} none of them defines alone.`
        : `No centre emerges here that ${names[0]} doesn't already carry — this group amplifies rather than adds.`

    return { name, accent, members, emergentCenters: emergent, insight }
  })
}
