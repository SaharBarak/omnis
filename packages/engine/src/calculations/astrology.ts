/**
 * Astrology Calculations
 *
 * Wraps the circular-natal-horoscope-js library to provide
 * Western tropical astrology natal chart calculations.
 */

import { Origin, Horoscope } from 'circular-natal-horoscope-js'
import type {
  AstrologyInput,
  NatalChart,
  SunSignChart,
  PlanetPosition,
  HousePosition,
  AspectInstance,
  ZodiacPosition,
  ZodiacSign,
  Planet,
  Aspect,
  PlanetId,
  Element,
  Modality,
  Dignity,
  ChartShape,
  HouseSystem,
} from '../types/astrology'
import {
  ZODIAC_SIGNS,
  getZodiacSignFromLongitude,
  getDegreeInSign,
  getMinuteInDegree,
  formatZodiacPosition,
} from '../data/zodiac-signs'
import { PLANETS, getPlanetById, PLANET_TO_LIBRARY_KEY } from '../data/planets'
import { HOUSES, getHouseByNumber } from '../data/houses'
import { ASPECTS, findAspect } from '../data/aspects'

/**
 * Map library house system keys to our HouseSystem type
 */
const HOUSE_SYSTEM_MAP: Record<HouseSystem, string> = {
  'placidus': 'placidus',
  'koch': 'koch',
  'whole-sign': 'whole-sign',
  'equal': 'equal-house',
  'campanus': 'campanus',
  'regiomontanus': 'regiomontanus',
  'topocentric': 'topocentric',
}

/**
 * Create a ZodiacPosition from ecliptic longitude
 */
function createZodiacPosition(longitude: number): ZodiacPosition {
  const sign = getZodiacSignFromLongitude(longitude)
  const degree = getDegreeInSign(longitude)
  const minute = getMinuteInDegree(longitude)
  const formatted = formatZodiacPosition(longitude)

  return {
    sign,
    degree,
    minute,
    longitude,
    formatted,
  }
}

/**
 * Map library body key to our PlanetId
 */
function libraryKeyToPlanetId(key: string): PlanetId | null {
  const mapping: Record<string, PlanetId> = {
    'sun': 'sun',
    'moon': 'moon',
    'mercury': 'mercury',
    'venus': 'venus',
    'mars': 'mars',
    'jupiter': 'jupiter',
    'saturn': 'saturn',
    'uranus': 'uranus',
    'neptune': 'neptune',
    'pluto': 'pluto',
    'northnode': 'northNode',
    'southnode': 'southNode',
    'lilith': 'lilith',
  }
  return mapping[key.toLowerCase()] ?? null
}

/**
 * Calculate planetary dignity based on sign placement
 */
function calculateDignity(planetId: PlanetId, sign: ZodiacSign): Dignity {
  // Domicile: planet rules the sign
  const domicileMap: Record<PlanetId, ZodiacSign['id'][]> = {
    sun: ['leo'],
    moon: ['cancer'],
    mercury: ['gemini', 'virgo'],
    venus: ['taurus', 'libra'],
    mars: ['aries', 'scorpio'],
    jupiter: ['sagittarius', 'pisces'],
    saturn: ['capricorn', 'aquarius'],
    uranus: ['aquarius'],
    neptune: ['pisces'],
    pluto: ['scorpio'],
    northNode: [],
    southNode: [],
    lilith: [],
  }

  // Exaltation signs
  const exaltationMap: Record<PlanetId, ZodiacSign['id'] | null> = {
    sun: 'aries',
    moon: 'taurus',
    mercury: 'virgo',
    venus: 'pisces',
    mars: 'capricorn',
    jupiter: 'cancer',
    saturn: 'libra',
    uranus: 'scorpio',
    neptune: 'cancer',
    pluto: 'leo',
    northNode: null,
    southNode: null,
    lilith: null,
  }

  // Detriment: opposite of domicile signs
  const detrimentMap: Record<PlanetId, ZodiacSign['id'][]> = {
    sun: ['aquarius'],
    moon: ['capricorn'],
    mercury: ['sagittarius', 'pisces'],
    venus: ['aries', 'scorpio'],
    mars: ['taurus', 'libra'],
    jupiter: ['gemini', 'virgo'],
    saturn: ['cancer', 'leo'],
    uranus: ['leo'],
    neptune: ['virgo'],
    pluto: ['taurus'],
    northNode: [],
    southNode: [],
    lilith: [],
  }

  // Fall: opposite of exaltation signs
  const fallMap: Record<PlanetId, ZodiacSign['id'] | null> = {
    sun: 'libra',
    moon: 'scorpio',
    mercury: 'pisces',
    venus: 'virgo',
    mars: 'cancer',
    jupiter: 'capricorn',
    saturn: 'aries',
    uranus: 'taurus',
    neptune: 'capricorn',
    pluto: 'aquarius',
    northNode: null,
    southNode: null,
    lilith: null,
  }

  if (domicileMap[planetId]?.includes(sign.id)) {
    return 'domicile'
  }
  if (exaltationMap[planetId] === sign.id) {
    return 'exaltation'
  }
  if (detrimentMap[planetId]?.includes(sign.id)) {
    return 'detriment'
  }
  if (fallMap[planetId] === sign.id) {
    return 'fall'
  }

  return 'neutral'
}

/**
 * Determine chart shape based on planetary distribution
 */
function determineChartShape(positions: PlanetPosition[]): ChartShape {
  const longitudes = positions
    .filter(p => p.planet.type !== 'point')
    .map(p => p.position.longitude)
    .sort((a, b) => a - b)

  if (longitudes.length < 7) {
    return 'splash' // Not enough planets to determine
  }

  // Calculate gaps between planets
  const gaps: number[] = []
  for (let i = 0; i < longitudes.length; i++) {
    const next = (i + 1) % longitudes.length
    let gap = longitudes[next] - longitudes[i]
    if (gap < 0) gap += 360
    gaps.push(gap)
  }

  const maxGap = Math.max(...gaps)
  const minGap = Math.min(...gaps)
  const totalSpan = 360 - maxGap

  // Bundle: all planets within 120°
  if (totalSpan <= 120) {
    return 'bundle'
  }

  // Bowl: all planets within 180°
  if (totalSpan <= 180) {
    return 'bowl'
  }

  // Bucket: bowl with one planet as "handle"
  if (maxGap >= 150 && gaps.filter(g => g >= 60).length === 1) {
    return 'bucket'
  }

  // Locomotive: all planets within 240° (empty trine)
  if (totalSpan <= 240 && maxGap >= 100) {
    return 'locomotive'
  }

  // Seesaw: two groups opposing each other
  const largeGaps = gaps.filter(g => g >= 60)
  if (largeGaps.length === 2) {
    return 'seesaw'
  }

  // Splay: irregular distribution
  if (minGap < 30 && maxGap > 60) {
    return 'splay'
  }

  // Default: splash (evenly distributed)
  return 'splash'
}

/**
 * Calculate element balance from planetary positions
 */
function calculateElementBalance(positions: PlanetPosition[]): Record<Element, number> {
  const counts: Record<Element, number> = {
    fire: 0,
    earth: 0,
    air: 0,
    water: 0,
  }

  // Weight by planet type
  const weights: Record<string, number> = {
    luminary: 2,
    personal: 1.5,
    social: 1,
    transpersonal: 0.5,
    point: 0.5,
  }

  let totalWeight = 0

  for (const pos of positions) {
    const weight = weights[pos.planet.type] ?? 1
    counts[pos.position.sign.element] += weight
    totalWeight += weight
  }

  // Normalize to percentages
  if (totalWeight > 0) {
    for (const element of Object.keys(counts) as Element[]) {
      counts[element] = Math.round((counts[element] / totalWeight) * 100)
    }
  }

  return counts
}

/**
 * Calculate modality balance from planetary positions
 */
function calculateModalityBalance(positions: PlanetPosition[]): Record<Modality, number> {
  const counts: Record<Modality, number> = {
    cardinal: 0,
    fixed: 0,
    mutable: 0,
  }

  const weights: Record<string, number> = {
    luminary: 2,
    personal: 1.5,
    social: 1,
    transpersonal: 0.5,
    point: 0.5,
  }

  let totalWeight = 0

  for (const pos of positions) {
    const weight = weights[pos.planet.type] ?? 1
    counts[pos.position.sign.modality] += weight
    totalWeight += weight
  }

  if (totalWeight > 0) {
    for (const modality of Object.keys(counts) as Modality[]) {
      counts[modality] = Math.round((counts[modality] / totalWeight) * 100)
    }
  }

  return counts
}

/**
 * Calculate which house a planet is in based on house cusps
 */
function findHouseForLongitude(longitude: number, houseCusps: number[]): number {
  const normalizedLong = ((longitude % 360) + 360) % 360

  for (let i = 0; i < 12; i++) {
    const cusp = houseCusps[i]
    const nextCusp = houseCusps[(i + 1) % 12]

    let inHouse: boolean
    if (cusp < nextCusp) {
      inHouse = normalizedLong >= cusp && normalizedLong < nextCusp
    } else {
      // Wraps around 360°
      inHouse = normalizedLong >= cusp || normalizedLong < nextCusp
    }

    if (inHouse) {
      return i + 1
    }
  }

  return 1 // Default to first house
}

/**
 * Extract aspects from horoscope results
 */
// Type for raw aspect data from the horoscope library
interface RawAspectData {
  point1Key?: string
  point1?: { key?: string }
  point2Key?: string
  point2?: { key?: string }
  aspectKey?: string
  label?: string
  orb?: number
  isApplying?: boolean
  applying?: boolean
}

function extractAspects(horoscope: Horoscope): AspectInstance[] {
  const aspects: AspectInstance[] = []
  const seenPairs = new Set<string>()

  try {
    const allAspects = (horoscope.Aspects?.all ?? []) as RawAspectData[]

    for (const aspectData of allAspects) {
      // The library uses point1Key/point2Key as direct properties
      const point1Key = (aspectData.point1Key ?? aspectData.point1?.key)?.toLowerCase()
      const point2Key = (aspectData.point2Key ?? aspectData.point2?.key)?.toLowerCase()

      if (!point1Key || !point2Key) continue

      const planet1 = libraryKeyToPlanetId(point1Key)
      const planet2 = libraryKeyToPlanetId(point2Key)

      if (!planet1 || !planet2) continue

      // Avoid duplicate pairs
      const pairKey = [planet1, planet2].sort().join('-')
      const aspectKey = aspectData.aspectKey ?? ''
      if (seenPairs.has(pairKey + aspectKey)) continue
      seenPairs.add(pairKey + aspectKey)

      // Find our aspect definition (library uses lowercase keys like "conjunction")
      const aspectName = aspectData.aspectKey ?? aspectData.label ?? ''
      const aspectDef = ASPECTS.find(
        a => a.name.toLowerCase() === aspectName.toLowerCase()
      )

      if (!aspectDef) continue

      aspects.push({
        planet1,
        planet2,
        aspect: aspectDef,
        exactAngle: aspectDef.angle,
        orb: typeof aspectData.orb === 'number' ? aspectData.orb : 0,
        applying: aspectData.isApplying ?? aspectData.applying ?? false,
      })
    }
  } catch (e) {
    // Silently handle aspect extraction errors
  }

  return aspects
}

/**
 * Calculate a full natal chart
 */
export function calculateNatalChart(input: AstrologyInput): NatalChart {
  const hasBirthTime = !!input.time

  // Parse date parts
  const [year, month, day] = input.date.split('-').map(Number)

  // Parse time (default to noon if not provided)
  let hour = 12
  let minute = 0
  if (input.time) {
    const [h, m] = input.time.split(':').map(Number)
    hour = h
    minute = m
  }

  // Create origin
  const origin = new Origin({
    year,
    month: month - 1, // 0-indexed months
    date: day,
    hour,
    minute,
    latitude: input.latitude,
    longitude: input.longitude,
  })

  // Create horoscope
  const houseSystem = input.houseSystem ?? 'placidus'
  const horoscope = new Horoscope({
    origin,
    houseSystem: HOUSE_SYSTEM_MAP[houseSystem],
    zodiac: input.zodiacType ?? 'tropical',
    aspectPoints: ['bodies', 'points', 'angles'],
    aspectWithPoints: ['bodies', 'points', 'angles'],
    aspectTypes: ['major', 'minor'],
    language: 'en',
  })

  // Process celestial bodies
  const planetPositions: PlanetPosition[] = []
  const houseCusps: number[] = []

  // Extract house cusps for house placement calculation
  if (hasBirthTime && horoscope.Houses) {
    for (let i = 0; i < 12; i++) {
      const houseData = horoscope.Houses[i]
      const cusp = houseData?.ChartPosition?.Ecliptic?.DecimalDegrees ?? (i * 30)
      houseCusps.push(cusp)
    }
  }

  // Process celestial bodies
  const celestialBodies = horoscope.CelestialBodies ?? {}
  for (const key of Object.keys(celestialBodies)) {
    if (key === 'all') continue

    const planetId = libraryKeyToPlanetId(key)
    if (!planetId) continue

    const planet = getPlanetById(planetId)
    const bodyData = celestialBodies[key]

    const longitude = bodyData?.ChartPosition?.Ecliptic?.DecimalDegrees ?? 0
    const position = createZodiacPosition(longitude)
    const retrograde = bodyData?.isRetrograde ?? false
    const house = hasBirthTime && houseCusps.length > 0
      ? findHouseForLongitude(longitude, houseCusps)
      : null

    planetPositions.push({
      planet,
      position,
      house,
      retrograde,
      dignity: calculateDignity(planetId, position.sign),
    })
  }

  // Process celestial points (nodes, lilith)
  const celestialPoints = horoscope.CelestialPoints ?? {}
  for (const key of Object.keys(celestialPoints)) {
    if (key === 'all') continue

    const planetId = libraryKeyToPlanetId(key)
    if (!planetId) continue

    const planet = getPlanetById(planetId)
    const pointData = celestialPoints[key]

    const longitude = pointData?.ChartPosition?.Ecliptic?.DecimalDegrees ?? 0
    const position = createZodiacPosition(longitude)
    const house = hasBirthTime && houseCusps.length > 0
      ? findHouseForLongitude(longitude, houseCusps)
      : null

    planetPositions.push({
      planet,
      position,
      house,
      retrograde: false,
      dignity: 'neutral',
    })
  }

  // Process houses
  let housePositions: HousePosition[] | null = null
  if (hasBirthTime && horoscope.Houses) {
    housePositions = []

    for (let i = 0; i < 12; i++) {
      const houseData = horoscope.Houses[i]
      const house = getHouseByNumber(i + 1)
      const cuspLongitude = houseData?.ChartPosition?.Ecliptic?.DecimalDegrees ?? (i * 30)
      const cusp = createZodiacPosition(cuspLongitude)

      // Find planets in this house
      const planetsInHouse = planetPositions
        .filter(p => p.house === i + 1)
        .map(p => p.planet.id)

      housePositions.push({
        house,
        cusp,
        planets: planetsInHouse,
      })
    }
  }

  // Extract angles
  let ascendant: ZodiacPosition | null = null
  let midheaven: ZodiacPosition | null = null
  let descendant: ZodiacPosition | null = null
  let imumCoeli: ZodiacPosition | null = null

  if (hasBirthTime) {
    const ascLong = horoscope.Ascendant?.ChartPosition?.Ecliptic?.DecimalDegrees
    if (typeof ascLong === 'number') {
      ascendant = createZodiacPosition(ascLong)
      descendant = createZodiacPosition((ascLong + 180) % 360)
    }

    const mcLong = horoscope.Midheaven?.ChartPosition?.Ecliptic?.DecimalDegrees
    if (typeof mcLong === 'number') {
      midheaven = createZodiacPosition(mcLong)
      imumCoeli = createZodiacPosition((mcLong + 180) % 360)
    }
  }

  // Extract aspects
  const aspects = extractAspects(horoscope)

  // Find sun, moon, rising
  const sunPosition = planetPositions.find(p => p.planet.id === 'sun')
  const moonPosition = planetPositions.find(p => p.planet.id === 'moon')

  const sunSign = sunPosition?.position.sign ?? ZODIAC_SIGNS[0]
  const moonSign = moonPosition?.position.sign ?? ZODIAC_SIGNS[0]
  const risingSign = ascendant?.sign ?? null

  // Calculate balances
  const elementBalance = calculateElementBalance(planetPositions)
  const modalityBalance = calculateModalityBalance(planetPositions)
  const chartShape = hasBirthTime ? determineChartShape(planetPositions) : null

  return {
    birthDate: input.date,
    birthTime: input.time ?? null,
    birthPlace: {
      name: '',
      latitude: input.latitude,
      longitude: input.longitude,
      timezone: input.timezone ?? 'UTC',
    },
    hasBirthTime,
    planets: planetPositions,
    houses: housePositions,
    aspects,
    ascendant,
    midheaven,
    descendant,
    imumCoeli,
    sunSign,
    moonSign,
    risingSign,
    elementBalance,
    modalityBalance,
    chartShape,
  }
}

/**
 * Calculate a simplified sun sign chart (when birth time is unknown)
 */
export function calculateSunSignChart(date: string, latitude: number, longitude: number): SunSignChart {
  const chart = calculateNatalChart({
    date,
    latitude,
    longitude,
  })

  return {
    birthDate: date,
    sunSign: chart.sunSign,
    planets: chart.planets.map(p => ({
      planet: p.planet,
      sign: p.position.sign,
      approximate: p.planet.id === 'moon', // Moon moves ~13° per day
    })),
    aspects: chart.aspects,
  }
}

/**
 * Get basic Sun sign from date only (quick calculation)
 */
export function getSunSign(date: string): ZodiacSign {
  const chart = calculateSunSignChart(date, 0, 0)
  return chart.sunSign
}

/**
 * Check if a date falls within a zodiac sign's period
 * (Approximate - sun enters each sign around the same date each year)
 */
export function getApproximateSunSign(month: number, day: number): ZodiacSign {
  // Approximate sun ingress dates
  const ingresses: Array<{ month: number; day: number; sign: number }> = [
    { month: 1, day: 20, sign: 11 },  // Aquarius
    { month: 2, day: 19, sign: 12 },  // Pisces
    { month: 3, day: 21, sign: 1 },   // Aries
    { month: 4, day: 20, sign: 2 },   // Taurus
    { month: 5, day: 21, sign: 3 },   // Gemini
    { month: 6, day: 21, sign: 4 },   // Cancer
    { month: 7, day: 23, sign: 5 },   // Leo
    { month: 8, day: 23, sign: 6 },   // Virgo
    { month: 9, day: 23, sign: 7 },   // Libra
    { month: 10, day: 23, sign: 8 },  // Scorpio
    { month: 11, day: 22, sign: 9 },  // Sagittarius
    { month: 12, day: 22, sign: 10 }, // Capricorn
  ]

  // Find the current sign
  for (let i = ingresses.length - 1; i >= 0; i--) {
    const ingress = ingresses[i]
    if (month > ingress.month || (month === ingress.month && day >= ingress.day)) {
      return ZODIAC_SIGNS[ingress.sign - 1]
    }
  }

  // Default to Capricorn (before Jan 20)
  return ZODIAC_SIGNS[9]
}

/**
 * Get the current planetary positions (for transit calculations)
 */
export function getCurrentPlanetaryPositions(date: string = new Date().toISOString().split('T')[0]): PlanetPosition[] {
  // Calculate for a neutral location (Greenwich)
  const chart = calculateNatalChart({
    date,
    latitude: 51.4772,
    longitude: -0.0005,
    time: '12:00',
  })

  // Return positions without house placements
  return chart.planets.map(p => ({
    ...p,
    house: null,
  }))
}

/**
 * Format a planet position for display
 */
export function formatPlanetPosition(position: PlanetPosition): string {
  const retrograde = position.retrograde ? ' ℞' : ''
  return `${position.planet.symbol} ${position.position.formatted}${retrograde}`
}

/**
 * Get a summary of the chart's key points
 */
export function getChartSummary(chart: NatalChart): {
  sunSign: string
  moonSign: string
  risingSign: string | null
  dominantElement: Element
  dominantModality: Modality
} {
  // Find dominant element
  const elements = Object.entries(chart.elementBalance) as [Element, number][]
  elements.sort((a, b) => b[1] - a[1])
  const dominantElement = elements[0][0]

  // Find dominant modality
  const modalities = Object.entries(chart.modalityBalance) as [Modality, number][]
  modalities.sort((a, b) => b[1] - a[1])
  const dominantModality = modalities[0][0]

  return {
    sunSign: chart.sunSign.name,
    moonSign: chart.moonSign.name,
    risingSign: chart.risingSign?.name ?? null,
    dominantElement,
    dominantModality,
  }
}
