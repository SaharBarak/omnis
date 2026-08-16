/**
 * Cross-check the Human Design engine against an independent implementation.
 *
 * The oracle (./oracle.py) shares no code with this repo: it computes the same
 * chart from Swiss Ephemeris using wheel constants transcribed from published
 * Human Design sources. Any disagreement is a real defect in one of the two.
 *
 *   pip install pyswisseph
 *   HD_ORACLE_PYTHON=/path/to/python npx tsx scripts/verify-human-design/compare.ts [chartCount]
 *
 * Expected result: mismatches only where a body sits within ~20 arcseconds of
 * an exact gate or line boundary, where the two ephemerides disagree by less
 * than their own error bars. Historically ~0.05% of activations.
 */
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { calculateBodygraph } from '../../packages/engine/src/calculations/human-design'

const HERE = dirname(fileURLToPath(import.meta.url))
const PYTHON = process.env.HD_ORACLE_PYTHON ?? 'python3'
const CHART_COUNT = Number(process.argv[2] ?? 400)

const PLANETS = [
  'sun', 'earth', 'moon', 'north-node', 'south-node', 'mercury', 'venus',
  'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto',
] as const

/** Spread of eras, hemispheres and timezone regimes, including historical DST. */
const PLACES: ReadonlyArray<readonly [number, number]> = [
  [32.0853, 34.7818], [40.7128, -74.006], [51.5074, -0.1278], [-33.8688, 151.2093],
  [35.6762, 139.6503], [-23.5505, -46.6333], [64.1466, -21.9426], [1.3521, 103.8198],
  [55.7558, 37.6173], [19.4326, -99.1332], [-1.2921, 36.8219], [28.6139, 77.209],
]

// Deterministic so a failure is reproducible.
let seed = 20260816
const random = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648
const pad = (n: number) => String(n).padStart(2, '0')

const cases = Array.from({ length: CHART_COUNT }, () => {
  const year = 1920 + Math.floor(random() * 106)
  const month = 1 + Math.floor(random() * 12)
  const day = 1 + Math.floor(random() * 28)
  const hour = Math.floor(random() * 24)
  const minute = Math.floor(random() * 60)
  const [latitude, longitude] = PLACES[Math.floor(random() * PLACES.length)]
  return {
    birthDate: `${year}-${pad(month)}-${pad(day)}`,
    birthTime: `${pad(hour)}:${pad(minute)}`,
    latitude,
    longitude,
  }
})

const results = cases.map((c) => calculateBodygraph(c) as never as Record<string, any>)
const instants = results.map((r) => r.birthInstantUtc.replace('.000Z', ''))

const oracle = JSON.parse(
  execFileSync(PYTHON, [join(HERE, 'oracle_batch.py')], {
    input: JSON.stringify(instants),
    encoding: 'utf8',
    maxBuffer: 1 << 28,
  })
)

let compared = 0
let worstDesignDeltaSeconds = 0
const mismatches: string[] = []

results.forEach((result, i) => {
  const reference = oracle[instants[i]]
  worstDesignDeltaSeconds = Math.max(
    worstDesignDeltaSeconds,
    Math.abs(
      new Date(result.designInstantUtc).getTime() - new Date(reference.design_utc).getTime()
    ) / 1000
  )

  for (const side of ['personality', 'design'] as const) {
    for (const planet of PLANETS) {
      const ours = result.activations[side].find((a: any) => a.planet === planet)
      const ref = reference[side][planet]
      compared++
      if (ours.gate !== ref.gate || ours.line !== ref.line) {
        const { birthDate, birthTime, latitude, longitude } = cases[i]
        mismatches.push(
          `${birthDate} ${birthTime} @${latitude},${longitude} ${side}/${planet}: ` +
            `ours=${ours.gate}.${ours.line} oracle=${ref.gate}.${ref.line} ` +
            `lon=${ours.zodiacDegree.toFixed(6)} oracleLon=${ref.lon}`
        )
      }
    }
  }
})

console.log(`charts: ${cases.length}`)
console.log(`activations compared: ${compared}`)
console.log(`mismatches: ${mismatches.length} (${((100 * mismatches.length) / compared).toFixed(3)}%)`)
console.log(`worst design-instant delta: ${worstDesignDeltaSeconds.toFixed(0)}s`)
for (const line of mismatches) console.log(`  ${line}`)
