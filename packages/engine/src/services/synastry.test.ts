import { describe, it, expect } from 'vitest'
import {
  calculateSynastryCompatibility,
  type SynastryConnection,
  type SynastryConnectionType,
  type SynastryInput,
} from './synastry'
import { calculateVertexLongitude, calculateNatalChart } from '../calculations/astrology'

// ── Fixtures ────────────────────────────────────────────────────────────────
// Real birth data chosen (by exhaustive search over synthetic charts) to contain
// the exact rare contacts each block is about.

/** Anchor: full birth data, tropical latitude. */
const ANCHOR: SynastryInput = {
  birthDate: '1970-01-28',
  birthTime: '16:31',
  latitude: -9.45,
  longitude: -12.16,
}
/** Has BOTH a Sun-Moon and a Venus-Mars double whammy with ANCHOR. */
const WHAMMY: SynastryInput = {
  birthDate: '1973-10-11',
  birthTime: '10:28',
  latitude: 44.62,
  longitude: 73.18,
}
/** Personal planet on ANCHOR's Vertex. */
const VERTEXED: SynastryInput = {
  birthDate: '2000-03-05',
  birthTime: '03:17',
  latitude: 4.79,
  longitude: 94.27,
}
/** Four planets landing in one of ANCHOR's houses. */
const STELLIUM: SynastryInput = {
  birthDate: '1991-08-21',
  birthTime: '23:16',
  latitude: 48.63,
  longitude: 53.99,
}
/** Node axis on the partner's ASC/DSC axis. */
const NODE_AXIS: SynastryInput = {
  birthDate: '1997-11-06',
  birthTime: '13:28',
  latitude: 2.56,
  longitude: -115.13,
}

const strip = (input: SynastryInput, ...keys: Array<'birthTime' | 'place'>): SynastryInput => {
  const next = { ...input }
  for (const k of keys) {
    if (k === 'birthTime') next.birthTime = null
    if (k === 'place') {
      next.latitude = null
      next.longitude = null
    }
  }
  return next
}

const of = (
  conns: readonly SynastryConnection[],
  type: SynastryConnectionType
): readonly SynastryConnection[] => conns.filter((c) => c.type === type)

const involves = (c: SynastryConnection, planet: string): boolean =>
  c.planet1 === planet || c.planet2 === planet || (c.planets?.includes(planet as never) ?? false)

/** Every tie that is NOT part of the legacy T0 background. */
const RARE_TYPES: readonly SynastryConnectionType[] = [
  'double-whammy',
  'tight-aspect',
  'node-contact',
  'node-axis-integration',
  'angle-contact',
  'vertex-contact',
  'house-overlay',
  'stellium-overlay',
]
const rareOnly = (conns: readonly SynastryConnection[]): readonly SynastryConnection[] =>
  conns.filter((c) => RARE_TYPES.includes(c.type))

describe('Synastry Compatibility Service', () => {
  describe('basic shape and determinism', () => {
    it('returns a valid 0-100 score with bilingual connections', () => {
      const p1: SynastryInput = { birthDate: '1990-06-15', birthTime: '14:30', latitude: 32.08, longitude: 34.78 }
      const p2: SynastryInput = { birthDate: '1992-11-03', birthTime: '09:15', latitude: 40.71, longitude: -74.0 }

      const result = calculateSynastryCompatibility(p1, p2)

      expect(result.available).toBe(true)
      expect(result.score).toBeGreaterThanOrEqual(0)
      expect(result.score).toBeLessThanOrEqual(100)
      expect(Number.isInteger(result.score)).toBe(true)
      expect(result.sunElement1).not.toBeNull()
      expect(result.sunElement2).not.toBeNull()

      for (const conn of result.connections) {
        expect(conn.description.length).toBeGreaterThan(0)
        expect(conn.descriptionHebrew.length).toBeGreaterThan(0)
        // Hebrew text must contain Hebrew characters.
        expect(/[֐-׿]/.test(conn.descriptionHebrew)).toBe(true)
        expect(['harmonious', 'challenging']).toContain(conn.harmony)
      }
    })

    it('is deterministic — identical inputs yield identical output', () => {
      const p1: SynastryInput = { birthDate: '1985-03-21', birthTime: '06:00', latitude: 0, longitude: 0 }
      const p2: SynastryInput = { birthDate: '1988-09-09', birthTime: '18:00', latitude: 0, longitude: 0 }

      const a = calculateSynastryCompatibility(p1, p2)
      const b = calculateSynastryCompatibility(p1, p2)

      expect(a.score).toBe(b.score)
      expect(a.connections.length).toBe(b.connections.length)
    })
  })

  describe('harmonious pairing (same / compatible element)', () => {
    it('two Sun-sign same-element charts include a harmonious element connection', () => {
      // Both Leo (fire): mid-August dates.
      const p1: SynastryInput = { birthDate: '1990-08-10', birthTime: '12:00', latitude: 0, longitude: 0 }
      const p2: SynastryInput = { birthDate: '1991-08-12', birthTime: '12:00', latitude: 0, longitude: 0 }

      const result = calculateSynastryCompatibility(p1, p2)

      expect(result.available).toBe(true)
      expect(result.sunElement1).toBe('fire')
      expect(result.sunElement2).toBe('fire')

      const elementConn = result.connections.find((c) => c.type === 'element')
      expect(elementConn).toBeDefined()
      expect(elementConn?.harmony).toBe('harmonious')
      // Same-element bonus should push score above the base of 20.
      expect(result.score).toBeGreaterThan(20)
    })
  })

  describe('challenging pairing (clashing element)', () => {
    it('fire vs water Sun signs records a challenging element connection', () => {
      // Aries (fire, late March) vs Cancer (water, early July).
      const p1: SynastryInput = { birthDate: '1990-03-28', birthTime: '12:00', latitude: 0, longitude: 0 }
      const p2: SynastryInput = { birthDate: '1990-07-05', birthTime: '12:00', latitude: 0, longitude: 0 }

      const result = calculateSynastryCompatibility(p1, p2)

      expect(result.available).toBe(true)
      expect(result.sunElement1).toBe('fire')
      expect(result.sunElement2).toBe('water')

      const elementConn = result.connections.find((c) => c.type === 'element')
      expect(elementConn).toBeDefined()
      expect(elementConn?.harmony).toBe('challenging')
    })
  })

  describe('missing-location fallback', () => {
    it('still computes when latitude/longitude are absent', () => {
      const p1: SynastryInput = { birthDate: '1990-06-15', birthTime: '14:30' }
      const p2: SynastryInput = { birthDate: '1992-11-03', birthTime: '09:15' }

      const result = calculateSynastryCompatibility(p1, p2)

      expect(result.available).toBe(true)
      expect(result.score).toBeGreaterThanOrEqual(0)
      expect(result.score).toBeLessThanOrEqual(100)
    })

    it('still computes when location is explicitly null and no birth time', () => {
      const p1: SynastryInput = { birthDate: '1990-06-15', birthTime: null, latitude: null, longitude: null }
      const p2: SynastryInput = { birthDate: '1992-11-03', latitude: null, longitude: null }

      const result = calculateSynastryCompatibility(p1, p2)

      expect(result.available).toBe(true)
      expect(result.sunElement1).not.toBeNull()
    })

    it('location does not change Sun element (longitude depends on date, not place)', () => {
      const withLoc = calculateSynastryCompatibility(
        { birthDate: '1990-06-15', birthTime: '14:30', latitude: 32.08, longitude: 34.78 },
        { birthDate: '1992-11-03', birthTime: '09:15', latitude: 32.08, longitude: 34.78 }
      )
      const noLoc = calculateSynastryCompatibility(
        { birthDate: '1990-06-15', birthTime: '14:30' },
        { birthDate: '1992-11-03', birthTime: '09:15' }
      )

      expect(withLoc.sunElement1).toBe(noLoc.sunElement1)
      expect(withLoc.sunElement2).toBe(noLoc.sunElement2)
    })
  })

  describe('identical birth data', () => {
    it('scores high — every planet conjuncts its counterpart', () => {
      const same: SynastryInput = { birthDate: '1990-06-15', birthTime: '14:30', latitude: 32.08, longitude: 34.78 }

      const result = calculateSynastryCompatibility(same, same)

      expect(result.available).toBe(true)
      // Identical charts: all key planets conjunct + same Sun element.
      expect(result.score).toBeGreaterThanOrEqual(80)

      // Sun-Sun conjunction must be present.
      const sunConj = result.connections.find(
        (c) => c.type === 'cross-aspect' && c.planet1 === 'sun' && c.planet2 === 'sun'
      )
      expect(sunConj).toBeDefined()
      expect(sunConj?.aspect).toBe('conjunction')
      expect(sunConj?.harmony).toBe('harmonious')

      // Same element bonus applies.
      expect(result.sunElement1).toBe(result.sunElement2)
    })
  })

  describe('unavailable when chart cannot be computed', () => {
    it('returns available: false for an empty birth date', () => {
      const result = calculateSynastryCompatibility(
        { birthDate: '' },
        { birthDate: '1990-06-15' }
      )

      expect(result.available).toBe(false)
      expect(result.score).toBe(0)
      expect(result.connections).toHaveLength(0)
    })
  })
  // ==========================================================================
  // DOUBLE WHAMMY (Arroyo) — the best discriminator available from date + time
  // ==========================================================================

  describe('double whammy', () => {
    it('detects a reciprocal Venus/Mars contact and reports both directions', () => {
      const result = calculateSynastryCompatibility(ANCHOR, WHAMMY)
      const whammies = of(result.connections, 'double-whammy')

      const venusMars = whammies.find(
        (c) => c.planets?.includes('venus') && c.planets?.includes('mars')
      )
      expect(venusMars).toBeDefined()
      expect(venusMars?.tier).toBe('T3')
      expect(venusMars?.orb).toBeGreaterThanOrEqual(0)
      expect(venusMars?.planets).toHaveLength(2)
    })

    it('requires BOTH legs — the reciprocity is real, not a relabelled aspect', () => {
      const result = calculateSynastryCompatibility(ANCHOR, WHAMMY)

      for (const whammy of of(result.connections, 'double-whammy')) {
        const [x, y] = whammy.planets as readonly [string, string]
        // Each leg must independently exist as a cross-aspect: A.x-B.y and A.y-B.x.
        const forward = of(result.connections, 'cross-aspect').some(
          (c) => c.planet1 === x && c.planet2 === y
        )
        const reverse = of(result.connections, 'cross-aspect').some(
          (c) => c.planet1 === y && c.planet2 === x
        )
        expect(forward).toBe(true)
        expect(reverse).toBe(true)
        expect(x).not.toBe(y) // a planet with itself is one contact, not two
      }
    })

    it('is symmetric — swapping the two people finds the same whammies', () => {
      const forward = calculateSynastryCompatibility(ANCHOR, WHAMMY)
      const reverse = calculateSynastryCompatibility(WHAMMY, ANCHOR)

      const key = (c: SynastryConnection): string =>
        [...(c.planets ?? [])].sort().join('-')
      const a = of(forward.connections, 'double-whammy').map(key).sort()
      const b = of(reverse.connections, 'double-whammy').map(key).sort()

      expect(a.length).toBeGreaterThan(0)
      expect(a).toEqual(b)
    })

    it('carries an orb equal to the WIDER of its two legs — the weakest link', () => {
      const result = calculateSynastryCompatibility(ANCHOR, WHAMMY)
      for (const whammy of of(result.connections, 'double-whammy')) {
        const [x, y] = whammy.planets as readonly [string, string]
        const legs = of(result.connections, 'cross-aspect')
          .filter(
            (c) =>
              (c.planet1 === x && c.planet2 === y) || (c.planet1 === y && c.planet2 === x)
          )
          .map((c) => c.orb ?? 0)
        expect(whammy.orb).toBeCloseTo(Math.max(...legs), 2)
      }
    })
  })

  // ==========================================================================
  // THE NEVER-FABRICATE RULE
  // ==========================================================================

  describe('Moon claims are suppressed without a birth time', () => {
    it('drops the Sun-Moon double whammy when either person lacks a birth time', () => {
      const withTime = calculateSynastryCompatibility(ANCHOR, WHAMMY)
      const sunMoon = (r: ReturnType<typeof calculateSynastryCompatibility>): boolean =>
        of(r.connections, 'double-whammy').some(
          (c) => c.planets?.includes('sun') && c.planets?.includes('moon')
        )

      // Baseline: the fixture really does have one.
      expect(sunMoon(withTime)).toBe(true)

      // A Moon is used on BOTH sides of a Sun-Moon whammy, so losing either
      // person's birth time must kill it.
      expect(sunMoon(calculateSynastryCompatibility(strip(ANCHOR, 'birthTime'), WHAMMY))).toBe(false)
      expect(sunMoon(calculateSynastryCompatibility(ANCHOR, strip(WHAMMY, 'birthTime')))).toBe(false)
    })

    it('emits no rare tie of any kind involving a timeless Moon', () => {
      const timeless = strip(ANCHOR, 'birthTime')
      const result = calculateSynastryCompatibility(timeless, WHAMMY)

      expect(result.available).toBe(true)
      expect(result.dataQuality1.hasBirthTime).toBe(false)

      // Person 1's Moon is a ±7° guess: it may not appear in ANY rare tie.
      // (planet1 belongs to person 1 by the ownership convention.)
      const p1MoonClaims = rareOnly(result.connections).filter(
        (c) => c.planet1 === 'moon' || (c.direction === 'p1-to-p2' && involves(c, 'moon'))
      )
      expect(p1MoonClaims).toEqual([])

      // Person 2 still has a birth time, so THEIR Moon is still usable.
      expect(result.dataQuality2.hasBirthTime).toBe(true)
    })

    it('keeps the Moon out of tight aspects when its owner has no birth time', () => {
      const result = calculateSynastryCompatibility(strip(ANCHOR, 'birthTime'), WHAMMY)
      for (const tight of of(result.connections, 'tight-aspect')) {
        expect(tight.planet1).not.toBe('moon')
      }
    })
  })

  describe('houses and angles require the owner’s exact time AND place', () => {
    it('emits house overlays in both directions when both people are fully known', () => {
      const result = calculateSynastryCompatibility(ANCHOR, STELLIUM)
      const overlays = of(result.connections, 'house-overlay')

      expect(overlays.length).toBeGreaterThan(0)
      expect(overlays.some((c) => c.direction === 'p1-to-p2')).toBe(true)
      expect(overlays.some((c) => c.direction === 'p2-to-p1')).toBe(true)
      for (const o of overlays) {
        expect(o.house).toBeGreaterThanOrEqual(1)
        expect(o.house).toBeLessThanOrEqual(12)
      }
    })

    it('emits NOTHING place-dependent when the place is missing', () => {
      const result = calculateSynastryCompatibility(strip(ANCHOR, 'place'), strip(STELLIUM, 'place'))

      expect(result.available).toBe(true)
      expect(result.dataQuality1.hasPlace).toBe(false)
      expect(result.dataQuality1.hasAngles).toBe(false)
      expect(result.dataQuality1.hasVertex).toBe(false)

      expect(of(result.connections, 'house-overlay')).toEqual([])
      expect(of(result.connections, 'stellium-overlay')).toEqual([])
      expect(of(result.connections, 'angle-contact')).toEqual([])
      expect(of(result.connections, 'vertex-contact')).toEqual([])
      expect(of(result.connections, 'node-axis-integration')).toEqual([])
    })

    it('emits NOTHING place-dependent when the birth time is missing', () => {
      const result = calculateSynastryCompatibility(
        strip(ANCHOR, 'birthTime'),
        strip(STELLIUM, 'birthTime')
      )

      expect(of(result.connections, 'house-overlay')).toEqual([])
      expect(of(result.connections, 'angle-contact')).toEqual([])
      expect(of(result.connections, 'vertex-contact')).toEqual([])
    })

    it('is asymmetric — only the person with full data can host houses or angles', () => {
      // Person 2 keeps full data; person 1 loses their place.
      const result = calculateSynastryCompatibility(strip(ANCHOR, 'place'), STELLIUM)

      const overlays = of(result.connections, 'house-overlay')
      expect(overlays.length).toBeGreaterThan(0)
      // Person 1 has no houses, so nothing can fall INTO them: every overlay must
      // be person 1's planets landing in person 2's houses.
      expect(overlays.every((c) => c.direction === 'p1-to-p2')).toBe(true)

      for (const angle of of(result.connections, 'angle-contact')) {
        expect(angle.direction).toBe('p1-to-p2')
      }
    })

    it('still emits nodal contacts without a birth time — nodes need only a date', () => {
      const dateOnly1: SynastryInput = { birthDate: '1970-01-28' }
      const dateOnly2: SynastryInput = { birthDate: '1973-10-11' }
      const result = calculateSynastryCompatibility(dateOnly1, dateOnly2)

      expect(result.available).toBe(true)
      // Nothing time/place dependent survives...
      expect(of(result.connections, 'house-overlay')).toEqual([])
      expect(of(result.connections, 'vertex-contact')).toEqual([])
      // ...but a Sun/Mercury/Venus/Mars-to-node contact is still legitimate.
      for (const node of of(result.connections, 'node-contact')) {
        expect(involves(node, 'moon')).toBe(false)
        expect(node.orb).toBeLessThanOrEqual(3)
      }
    })
  })

  // ==========================================================================
  // VERTEX
  // ==========================================================================

  describe('vertex', () => {
    it('is null above |lat| 66°, where it is undefined — never a wrong number', () => {
      expect(calculateVertexLongitude({ midheavenLongitude: 100, latitude: 70 })).toBeNull()
      expect(calculateVertexLongitude({ midheavenLongitude: 100, latitude: -70 })).toBeNull()
      expect(calculateVertexLongitude({ midheavenLongitude: 100, latitude: 66.5 })).toBeNull()

      // Just inside the limit it is still computed.
      const inside = calculateVertexLongitude({ midheavenLongitude: 100, latitude: 65 })
      expect(inside).not.toBeNull()
      expect(inside).toBeGreaterThanOrEqual(0)
      expect(inside).toBeLessThan(360)
    })

    it('is null on a polar chart, and no vertex contact is emitted for that person', () => {
      const polar: SynastryInput = {
        birthDate: '1988-02-11',
        birthTime: '09:20',
        latitude: 78.22, // Svalbard
        longitude: 15.65,
      }
      const chart = calculateNatalChart({
        date: polar.birthDate,
        time: polar.birthTime as string,
        latitude: polar.latitude as number,
        longitude: polar.longitude as number,
      })
      expect(chart.vertex).toBeNull()

      const result = calculateSynastryCompatibility(ANCHOR, polar)
      expect(result.dataQuality2.hasVertex).toBe(false)
      // ANCHOR still has a Vertex, so contacts INTO person 1 remain possible;
      // contacts into person 2's (nonexistent) Vertex must not appear.
      for (const v of of(result.connections, 'vertex-contact')) {
        expect(v.direction).toBe('p2-to-p1')
      }
    })

    it('matches the independent co-latitude closed form', () => {
      // Vertex = Ascendant computed for RAMC + 180° at the signed co-latitude.
      const D = Math.PI / 180
      const n360 = (x: number): number => ((x % 360) + 360) % 360
      const obliquity = (year: number): number => 23.439291 - 0.0130042 * ((year - 2000) / 100)
      const ra = (lon: number, e: number): number =>
        n360(Math.atan2(Math.sin(lon * D) * Math.cos(e * D), Math.cos(lon * D)) / D)
      const ascendant = (ramc: number, lat: number, e: number): number =>
        n360(
          Math.atan2(
            Math.cos(ramc * D),
            -(Math.sin(ramc * D) * Math.cos(e * D) + Math.tan(lat * D) * Math.sin(e * D))
          ) / D
        )

      const cases = [
        { date: '1970-01-28', time: '16:31', latitude: -9.45, longitude: -12.16 },
        { date: '1991-08-21', time: '23:16', latitude: 48.63, longitude: 53.99 },
        { date: '1960-11-02', time: '21:05', latitude: -33.87, longitude: 151.2 },
        { date: '1978-06-14', time: '05:20', latitude: 59.33, longitude: 18.06 },
      ]

      for (const c of cases) {
        const chart = calculateNatalChart(c)
        const e = obliquity(Number(c.date.slice(0, 4)))
        const ramc = ra(chart.midheaven!.longitude, e)
        const coLatitude = Math.sign(c.latitude) * (90 - Math.abs(c.latitude))
        const closedForm = ascendant(ramc + 180, coLatitude, e)

        const delta = Math.abs(((chart.vertex!.longitude - closedForm + 540) % 360) - 180)
        expect(delta).toBeLessThan(0.01)
      }
    })

    it('only reports a vertex contact within 1°', () => {
      const result = calculateSynastryCompatibility(ANCHOR, VERTEXED)
      const contacts = of(result.connections, 'vertex-contact')

      expect(contacts.length).toBeGreaterThan(0)
      for (const v of contacts) {
        expect(v.orb).toBeLessThanOrEqual(1)
        expect(v.tight).toBe(true)
        expect(v.tier).toBe('T3')
      }
    })
  })

  // ==========================================================================
  // OVERLAYS, ANGLES, NODES
  // ==========================================================================

  describe('stellium overlay', () => {
    it('fires when 3+ of one person’s planets land in a single house of the other', () => {
      const result = calculateSynastryCompatibility(ANCHOR, STELLIUM)
      const stelliums = of(result.connections, 'stellium-overlay')

      expect(stelliums.length).toBeGreaterThan(0)

      for (const s of stelliums) {
        expect(s.planets!.length).toBeGreaterThanOrEqual(3)
        expect(new Set(s.planets!).size).toBe(s.planets!.length)

        // Every member must independently be reported as landing in that house.
        const overlays = of(result.connections, 'house-overlay').filter(
          (o) => o.direction === s.direction && o.house === s.house
        )
        const members = new Set(overlays.flatMap((o) => o.planets ?? []))
        for (const p of s.planets!) expect(members.has(p)).toBe(true)
      }
    })

    it('tiers by cluster SIZE, not by name — a 3-planet cluster fires on 60% of pairs', () => {
      const result = calculateSynastryCompatibility(ANCHOR, STELLIUM)
      for (const s of of(result.connections, 'stellium-overlay')) {
        const n = s.planets!.length
        const expected = n >= 5 ? 'T3' : n === 4 ? 'T2' : 'T1'
        expect(s.tier).toBe(expected)
      }
    })
  })

  describe('node axis integration', () => {
    it('detects one person’s node axis on the other’s ASC/DSC axis within 3°', () => {
      const result = calculateSynastryCompatibility(ANCHOR, NODE_AXIS)
      const axis = of(result.connections, 'node-axis-integration')

      expect(axis.length).toBeGreaterThan(0)
      for (const a of axis) {
        expect(a.orb).toBeLessThanOrEqual(3)
        expect(a.tier).toBe('T3')
        expect(a.angle).toBe('ascendant')
      }
    })
  })

  // ==========================================================================
  // CONTRACT
  // ==========================================================================

  describe('tie contract', () => {
    it('every angular tie carries an orb, so callers can rank by tightness', () => {
      const result = calculateSynastryCompatibility(ANCHOR, WHAMMY)

      for (const c of result.connections) {
        if (c.type === 'element' || c.type === 'house-overlay') continue
        expect(c.orb).not.toBeNull()
        expect(c.orb).toBeGreaterThanOrEqual(0)
        expect(c.tight).toBe((c.orb as number) <= 1)
      }
    })

    it('discriminators are the T2/T3 subset, rarest first then tightest', () => {
      const result = calculateSynastryCompatibility(ANCHOR, WHAMMY)

      expect(result.discriminators.length).toBeGreaterThan(0)
      for (const d of result.discriminators) {
        expect(['T2', 'T3']).toContain(d.tier)
      }
      // No T0 background may leak into the drawable set.
      expect(result.discriminators.some((d) => d.type === 'cross-aspect')).toBe(false)
      expect(result.discriminators.some((d) => d.type === 'element')).toBe(false)

      const rank = { T3: 0, T2: 1 } as const
      for (let i = 1; i < result.discriminators.length; i++) {
        const prev = result.discriminators[i - 1]
        const curr = result.discriminators[i]
        const pr = rank[prev.tier as 'T2' | 'T3']
        const cr = rank[curr.tier as 'T2' | 'T3']
        expect(pr).toBeLessThanOrEqual(cr)
        if (pr === cr) {
          expect(prev.orb ?? Infinity).toBeLessThanOrEqual(curr.orb ?? Infinity)
        }
      }
    })

    it('keeps the legacy cross-aspect and element ties intact (additive change)', () => {
      const result = calculateSynastryCompatibility(ANCHOR, WHAMMY)
      expect(of(result.connections, 'cross-aspect').length).toBeGreaterThan(0)
      expect(of(result.connections, 'element').length).toBe(1)
      expect(result.score).toBeGreaterThanOrEqual(0)
      expect(result.score).toBeLessThanOrEqual(100)
    })

    it('reports data quality honestly', () => {
      const full = calculateSynastryCompatibility(ANCHOR, WHAMMY)
      expect(full.dataQuality1).toEqual({
        hasBirthTime: true,
        hasPlace: true,
        hasAngles: true,
        hasVertex: true,
      })

      const bare = calculateSynastryCompatibility({ birthDate: '1970-01-28' }, WHAMMY)
      expect(bare.dataQuality1).toEqual({
        hasBirthTime: false,
        hasPlace: false,
        hasAngles: false,
        hasVertex: false,
      })
    })
  })
})
