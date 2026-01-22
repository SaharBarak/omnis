/**
 * Human Design Calculations
 *
 * Generates a complete bodygraph from birth data by:
 * 1. Calculating planetary positions at birth (personality)
 * 2. Calculating positions ~88° solar arc before birth (design)
 * 3. Converting positions to gates and lines
 * 4. Determining defined centers and channels
 * 5. Determining type, authority, and profile
 */

import { Origin, Horoscope } from 'circular-natal-horoscope-js'
import type {
  HumanDesignInput,
  HumanDesignResult,
  Bodygraph,
  PartialBodygraph,
  PlanetaryActivation,
  ActivationSet,
  CenterState,
  CenterId,
  HumanDesignType,
  Authority,
  Profile,
  ProfileLine,
  Definition,
  IncarnationCross,
  HumanDesignPlanet,
  Channel,
} from '../types/human-design'
import { longitudeToGate, GATE_TO_CENTER, GATES_BY_CENTER, getGate } from '../data/human-design-gates'
import { findDefinedChannels, CHANNELS, getChannelByGates } from '../data/human-design-channels'
import {
  CENTERS,
  getTypeDefinition,
  getAuthorityDefinition,
  getProfileByLines,
  MOTOR_CENTERS,
  getQuarterFromGate,
} from '../data/human-design'

// =============================================================================
// PLANETARY POSITION CALCULATIONS
// =============================================================================

/**
 * The 13 planetary bodies used in Human Design
 */
const HD_PLANETS: HumanDesignPlanet[] = [
  'sun',
  'earth',
  'moon',
  'north-node',
  'south-node',
  'mercury',
  'venus',
  'mars',
  'jupiter',
  'saturn',
  'uranus',
  'neptune',
  'pluto',
]

/**
 * Map library body key to our HD planet type
 */
function libraryKeyToHDPlanet(key: string): HumanDesignPlanet | null {
  const mapping: Record<string, HumanDesignPlanet> = {
    sun: 'sun',
    moon: 'moon',
    mercury: 'mercury',
    venus: 'venus',
    mars: 'mars',
    jupiter: 'jupiter',
    saturn: 'saturn',
    uranus: 'uranus',
    neptune: 'neptune',
    pluto: 'pluto',
    northnode: 'north-node',
    southnode: 'south-node',
  }
  return mapping[key.toLowerCase()] ?? null
}

/**
 * Calculate planetary positions for a given date/time/location
 */
function calculatePlanetaryPositions(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  latitude: number,
  longitude: number
): Map<HumanDesignPlanet, number> {
  const origin = new Origin({
    year,
    month: month - 1, // 0-indexed months
    date: day,
    hour,
    minute,
    latitude,
    longitude,
  })

  const horoscope = new Horoscope({
    origin,
    houseSystem: 'placidus',
    zodiac: 'tropical',
    aspectPoints: [],
    aspectWithPoints: [],
    aspectTypes: [],
    language: 'en',
  })

  const positions = new Map<HumanDesignPlanet, number>()

  // Extract celestial body positions
  const celestialBodies = horoscope.CelestialBodies ?? {}
  for (const key of Object.keys(celestialBodies)) {
    if (key === 'all') continue

    const planet = libraryKeyToHDPlanet(key)
    if (!planet) continue

    const bodyData = celestialBodies[key]
    const longitude = bodyData?.ChartPosition?.Ecliptic?.DecimalDegrees ?? 0
    positions.set(planet, longitude)

    // Calculate Earth position (opposite of Sun)
    if (planet === 'sun') {
      positions.set('earth', (longitude + 180) % 360)
    }
  }

  // Extract celestial points (nodes)
  const celestialPoints = horoscope.CelestialPoints ?? {}
  for (const key of Object.keys(celestialPoints)) {
    if (key === 'all') continue

    const planet = libraryKeyToHDPlanet(key)
    if (!planet) continue

    const pointData = celestialPoints[key]
    const longitude = pointData?.ChartPosition?.Ecliptic?.DecimalDegrees ?? 0
    positions.set(planet, longitude)
  }

  return positions
}

/**
 * Calculate the design date (~88° solar arc before birth)
 *
 * In Human Design, the Design calculation is made for the moment
 * when the Sun was at a position 88° (88 solar arc degrees) before
 * its position at birth. This is approximately 88 days before birth.
 */
function calculateDesignDate(birthDate: Date): Date {
  // ~88 degrees of solar arc corresponds to approximately 88-89 days
  // We use 88 days as the approximation
  const designDate = new Date(birthDate)
  designDate.setDate(designDate.getDate() - 88)
  return designDate
}

/**
 * Convert planetary positions to gate activations
 */
function positionsToActivations(
  positions: Map<HumanDesignPlanet, number>
): PlanetaryActivation[] {
  const activations: PlanetaryActivation[] = []

  for (const planet of HD_PLANETS) {
    const longitude = positions.get(planet)
    if (longitude === undefined) continue

    const { gate, line } = longitudeToGate(longitude)

    activations.push({
      planet,
      gate,
      line: line as ProfileLine,
      zodiacDegree: longitude,
    })
  }

  return activations
}

// =============================================================================
// CENTER STATE CALCULATIONS
// =============================================================================

/**
 * Calculate center states from active gates
 */
function calculateCenterStates(
  activeGates: readonly number[]
): Record<CenterId, CenterState> {
  const gateSet = new Set(activeGates)
  const states: Record<CenterId, CenterState> = {} as Record<CenterId, CenterState>

  for (const center of CENTERS) {
    const activeGatesInCenter = center.gates.filter((g) => gateSet.has(g))

    // A center is defined if it has at least one complete channel
    // (both gates of a channel are active)
    const definedChannels = findDefinedChannels(activeGates).filter(
      (ch) => ch.centers.includes(center.id)
    )

    states[center.id] = {
      centerId: center.id,
      defined: definedChannels.length > 0,
      activeGates: activeGatesInCenter,
    }
  }

  return states
}

/**
 * Get list of defined center IDs
 */
function getDefinedCenters(states: Record<CenterId, CenterState>): CenterId[] {
  return Object.values(states)
    .filter((s) => s.defined)
    .map((s) => s.centerId)
}

/**
 * Get list of undefined center IDs
 */
function getUndefinedCenters(states: Record<CenterId, CenterState>): CenterId[] {
  return Object.values(states)
    .filter((s) => !s.defined)
    .map((s) => s.centerId)
}

// =============================================================================
// TYPE DETERMINATION
// =============================================================================

/**
 * Check if there's a motor connection to the throat
 *
 * This traverses the defined channels to see if any motor center
 * (Sacral, Root, Solar Plexus, Heart) is connected to the Throat
 * either directly or through other defined centers.
 */
function hasMotorToThroat(
  centerStates: Record<CenterId, CenterState>,
  definedChannels: readonly Channel[]
): boolean {
  if (!centerStates.throat.defined) {
    return false
  }

  // Build adjacency map of defined connections
  const connections = new Map<CenterId, Set<CenterId>>()
  for (const channel of definedChannels) {
    const [c1, c2] = channel.centers
    if (!connections.has(c1)) connections.set(c1, new Set())
    if (!connections.has(c2)) connections.set(c2, new Set())
    connections.get(c1)!.add(c2)
    connections.get(c2)!.add(c1)
  }

  // BFS from motor centers to throat
  const visited = new Set<CenterId>()
  const queue: CenterId[] = [...MOTOR_CENTERS].filter((c) => centerStates[c].defined)

  while (queue.length > 0) {
    const current = queue.shift()!
    if (visited.has(current)) continue
    visited.add(current)

    if (current === 'throat') {
      return true
    }

    const neighbors = connections.get(current)
    if (neighbors) {
      const neighborArray = Array.from(neighbors)
      for (const neighbor of neighborArray) {
        if (!visited.has(neighbor) && centerStates[neighbor as CenterId].defined) {
          queue.push(neighbor)
        }
      }
    }
  }

  return false
}

/**
 * Determine the Human Design type
 */
function determineType(
  centerStates: Record<CenterId, CenterState>,
  definedChannels: readonly Channel[]
): HumanDesignType {
  const definedCenters = getDefinedCenters(centerStates)

  // Reflector: No centers defined
  if (definedCenters.length === 0) {
    return 'reflector'
  }

  const sacralDefined = centerStates.sacral.defined
  const motorToThroat = hasMotorToThroat(centerStates, definedChannels)

  // Manifestor: Motor to Throat, Sacral undefined
  if (motorToThroat && !sacralDefined) {
    return 'manifestor'
  }

  // Generator types: Sacral defined
  if (sacralDefined) {
    if (motorToThroat) {
      return 'manifesting-generator'
    }
    return 'generator'
  }

  // Projector: No sacral, no motor-to-throat
  return 'projector'
}

// =============================================================================
// AUTHORITY DETERMINATION
// =============================================================================

/**
 * Determine inner authority
 */
function determineAuthority(
  centerStates: Record<CenterId, CenterState>,
  type: HumanDesignType,
  definedChannels: readonly Channel[]
): Authority {
  // Reflector always has lunar authority
  if (type === 'reflector') {
    return 'lunar'
  }

  // Emotional authority: Solar Plexus defined
  if (centerStates.solar.defined) {
    return 'emotional'
  }

  // Sacral authority: Sacral defined, no emotional
  if (centerStates.sacral.defined) {
    return 'sacral'
  }

  // Splenic authority: Spleen defined, no sacral/emotional
  if (centerStates.spleen.defined) {
    return 'splenic'
  }

  // Ego/Heart authority
  if (centerStates.heart.defined) {
    // Check if heart connects to throat
    const heartToThroat = definedChannels.some(
      (ch) =>
        (ch.centers[0] === 'heart' && ch.centers[1] === 'throat') ||
        (ch.centers[0] === 'throat' && ch.centers[1] === 'heart')
    )

    if (type === 'manifestor' || (type !== 'projector' && heartToThroat)) {
      return 'ego-manifested'
    }
    if (type === 'projector') {
      return 'ego-projected'
    }
  }

  // Self-projected authority: G center to throat (Projector)
  if (type === 'projector' && centerStates.g.defined) {
    const gToThroat = definedChannels.some(
      (ch) =>
        (ch.centers[0] === 'g' && ch.centers[1] === 'throat') ||
        (ch.centers[0] === 'throat' && ch.centers[1] === 'g')
    )
    if (gToThroat) {
      return 'self-projected'
    }
  }

  // Mental (None) authority: Projector with only head/ajna defined
  return 'mental'
}

// =============================================================================
// PROFILE CALCULATION
// =============================================================================

/**
 * Determine profile from Sun line positions
 */
function determineProfile(
  personality: readonly PlanetaryActivation[],
  design: readonly PlanetaryActivation[]
): Profile {
  const personalitySun = personality.find((a) => a.planet === 'sun')
  const designSun = design.find((a) => a.planet === 'sun')

  const consciousLine = (personalitySun?.line ?? 1) as ProfileLine
  const unconsciousLine = (designSun?.line ?? 3) as ProfileLine

  const profile = getProfileByLines(consciousLine, unconsciousLine)

  // Return found profile or create a default
  if (profile) {
    return profile
  }

  // Fallback for unexpected combinations
  return {
    id: `${consciousLine}/${unconsciousLine}`,
    conscious: consciousLine,
    unconscious: unconsciousLine,
    name: `${consciousLine}/${unconsciousLine}`,
    nameHebrew: `${consciousLine}/${unconsciousLine}`,
    theme: 'Unique combination',
  }
}

// =============================================================================
// DEFINITION CALCULATION
// =============================================================================

/**
 * Calculate definition type (how centers are connected)
 */
function calculateDefinition(
  centerStates: Record<CenterId, CenterState>,
  definedChannels: readonly Channel[]
): Definition {
  const definedCenters = getDefinedCenters(centerStates)

  if (definedCenters.length === 0) {
    return 'none'
  }

  // Build adjacency graph of defined centers
  const connections = new Map<CenterId, Set<CenterId>>()
  for (const center of definedCenters) {
    connections.set(center, new Set())
  }

  for (const channel of definedChannels) {
    const [c1, c2] = channel.centers
    if (connections.has(c1) && connections.has(c2)) {
      connections.get(c1)!.add(c2)
      connections.get(c2)!.add(c1)
    }
  }

  // Count connected components using BFS
  const visited = new Set<CenterId>()
  let components = 0

  for (const center of definedCenters) {
    if (visited.has(center)) continue

    components++
    const queue: CenterId[] = [center]

    while (queue.length > 0) {
      const current = queue.shift()!
      if (visited.has(current)) continue
      visited.add(current)

      const neighbors = connections.get(current)
      if (neighbors) {
        const neighborArray = Array.from(neighbors)
        for (const neighbor of neighborArray) {
          if (!visited.has(neighbor)) {
            queue.push(neighbor)
          }
        }
      }
    }
  }

  switch (components) {
    case 1:
      return 'single'
    case 2:
      return 'split'
    case 3:
      return 'triple-split'
    default:
      return 'quadruple-split'
  }
}

// =============================================================================
// INCARNATION CROSS
// =============================================================================

/**
 * Calculate incarnation cross from Sun/Earth positions
 */
function calculateIncarnationCross(
  personality: readonly PlanetaryActivation[],
  design: readonly PlanetaryActivation[]
): IncarnationCross {
  const personalitySun = personality.find((a) => a.planet === 'sun')
  const personalityEarth = personality.find((a) => a.planet === 'earth')
  const designSun = design.find((a) => a.planet === 'sun')
  const designEarth = design.find((a) => a.planet === 'earth')

  const gates = {
    personalitySun: personalitySun?.gate ?? 1,
    personalityEarth: personalityEarth?.gate ?? 2,
    designSun: designSun?.gate ?? 1,
    designEarth: designEarth?.gate ?? 2,
  }

  // Determine cross type based on personality sun line
  const line = personalitySun?.line ?? 1
  let crossType: 'right-angle' | 'juxtaposition' | 'left-angle'

  if (line === 1 || line === 2) {
    crossType = 'right-angle'
  } else if (line === 4) {
    crossType = 'juxtaposition'
  } else {
    crossType = 'left-angle'
  }

  // Get quarter from personality sun gate
  const quarter = (getQuarterFromGate(gates.personalitySun) ?? 'initiation') as IncarnationCross['quarter']

  // Get gate names for cross name
  const sunGate = getGate(gates.personalitySun)
  const earthGate = getGate(gates.personalityEarth)

  const crossPrefix =
    crossType === 'right-angle'
      ? 'Right Angle Cross of'
      : crossType === 'juxtaposition'
        ? 'Juxtaposition Cross of'
        : 'Left Angle Cross of'

  return {
    name: `${crossPrefix} ${sunGate.name}`,
    nameHebrew: `צלב ${sunGate.nameHebrew}`,
    quarter,
    gates,
    theme: `Life purpose through ${sunGate.keywords[0]} and ${earthGate.keywords[0]}`,
  }
}

// =============================================================================
// MAIN CALCULATION FUNCTION
// =============================================================================

/**
 * Calculate a complete Human Design bodygraph
 *
 * @param input Birth data including date, time, and location
 * @returns Complete Bodygraph or PartialBodygraph if birth time is missing
 */
export function calculateBodygraph(input: HumanDesignInput): HumanDesignResult {
  // Check for required birth time
  if (!input.birthTime) {
    return {
      birthDate: input.birthDate,
      hasBirthTime: false,
      message: 'Human Design requires birth time for accurate calculations.',
      messageHebrew: 'עיצוב אנושי דורש שעת לידה לחישובים מדויקים.',
    } as PartialBodygraph
  }

  // Parse birth date and time
  const [year, month, day] = input.birthDate.split('-').map(Number)
  const [hour, minute] = input.birthTime.split(':').map(Number)

  // Calculate personality positions (at birth)
  const personalityPositions = calculatePlanetaryPositions(
    year,
    month,
    day,
    hour,
    minute,
    input.latitude,
    input.longitude
  )

  // Calculate design date (~88 days before birth)
  const birthDateTime = new Date(year, month - 1, day, hour, minute)
  const designDateTime = calculateDesignDate(birthDateTime)

  // Calculate design positions
  const designPositions = calculatePlanetaryPositions(
    designDateTime.getFullYear(),
    designDateTime.getMonth() + 1,
    designDateTime.getDate(),
    designDateTime.getHours(),
    designDateTime.getMinutes(),
    input.latitude,
    input.longitude
  )

  // Convert to activations
  const personalityActivations = positionsToActivations(personalityPositions)
  const designActivations = positionsToActivations(designPositions)

  // Combine all active gates
  const allGates = [
    ...personalityActivations.map((a) => a.gate),
    ...designActivations.map((a) => a.gate),
  ]
  const uniqueGates = Array.from(new Set(allGates))

  // Calculate center states
  const centerStates = calculateCenterStates(uniqueGates)
  const definedCenters = getDefinedCenters(centerStates)
  const undefinedCenters = getUndefinedCenters(centerStates)

  // Find defined channels
  const definedChannels = findDefinedChannels(uniqueGates)

  // Determine type, authority, profile
  const type = determineType(centerStates, definedChannels)
  const authority = determineAuthority(centerStates, type, definedChannels)
  const profile = determineProfile(personalityActivations, designActivations)
  const definition = calculateDefinition(centerStates, definedChannels)

  // Calculate incarnation cross
  const incarnationCross = calculateIncarnationCross(
    personalityActivations,
    designActivations
  )

  return {
    birthDate: input.birthDate,
    birthTime: input.birthTime,
    birthPlace: {
      latitude: input.latitude,
      longitude: input.longitude,
    },
    type,
    typeDefinition: getTypeDefinition(type),
    authority,
    authorityDefinition: getAuthorityDefinition(authority),
    profile,
    definition,
    centers: centerStates,
    definedCenters,
    undefinedCenters,
    channels: definedChannels,
    gates: uniqueGates,
    activations: {
      personality: personalityActivations,
      design: designActivations,
    },
    incarnationCross,
    hasBirthTime: true,
    isComplete: true,
  } as Bodygraph
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Check if a bodygraph result is complete (has birth time)
 */
export function isCompleteBodygraph(result: HumanDesignResult): result is Bodygraph {
  return 'isComplete' in result && result.isComplete
}

/**
 * Get all unique gates from a bodygraph
 */
export function getAllGates(bodygraph: Bodygraph): readonly number[] {
  return bodygraph.gates
}

/**
 * Get personality-only gates (black/conscious)
 */
export function getPersonalityGates(bodygraph: Bodygraph): number[] {
  return bodygraph.activations.personality.map((a) => a.gate)
}

/**
 * Get design-only gates (red/unconscious)
 */
export function getDesignGates(bodygraph: Bodygraph): number[] {
  return bodygraph.activations.design.map((a) => a.gate)
}

/**
 * Check if a gate is activated in personality (conscious)
 */
export function isPersonalityGate(bodygraph: Bodygraph, gate: number): boolean {
  return bodygraph.activations.personality.some((a) => a.gate === gate)
}

/**
 * Check if a gate is activated in design (unconscious)
 */
export function isDesignGate(bodygraph: Bodygraph, gate: number): boolean {
  return bodygraph.activations.design.some((a) => a.gate === gate)
}

/**
 * Get the activation details for a specific gate
 */
export function getGateActivation(
  bodygraph: Bodygraph,
  gate: number
): { personality?: PlanetaryActivation; design?: PlanetaryActivation } {
  return {
    personality: bodygraph.activations.personality.find((a) => a.gate === gate),
    design: bodygraph.activations.design.find((a) => a.gate === gate),
  }
}

/**
 * Get a summary of the bodygraph for display
 */
export function getBodygraphSummary(bodygraph: Bodygraph): {
  type: string
  typeHebrew: string
  authority: string
  authorityHebrew: string
  profile: string
  definition: string
  definedCentersCount: number
  channelCount: number
} {
  return {
    type: bodygraph.typeDefinition.name,
    typeHebrew: bodygraph.typeDefinition.nameHebrew,
    authority: bodygraph.authorityDefinition.name,
    authorityHebrew: bodygraph.authorityDefinition.nameHebrew,
    profile: bodygraph.profile.name,
    definition: bodygraph.definition,
    definedCentersCount: bodygraph.definedCenters.length,
    channelCount: bodygraph.channels.length,
  }
}

/**
 * Format gate activation for display
 */
export function formatGateActivation(activation: PlanetaryActivation): string {
  const gate = getGate(activation.gate)
  return `Gate ${activation.gate}.${activation.line} - ${gate.name} (${activation.planet})`
}

/**
 * Get which planets activate a specific gate
 */
export function getPlanetsForGate(
  bodygraph: Bodygraph,
  gate: number
): { personality: HumanDesignPlanet[]; design: HumanDesignPlanet[] } {
  return {
    personality: bodygraph.activations.personality
      .filter((a) => a.gate === gate)
      .map((a) => a.planet),
    design: bodygraph.activations.design
      .filter((a) => a.gate === gate)
      .map((a) => a.planet),
  }
}
