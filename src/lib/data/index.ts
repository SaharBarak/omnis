export { SEALS, getSeal } from './seals'
export { TONES, getTone } from './tones'
export { getAnalog, getAntipode, getOccult, getGuide } from './oracle-tables'
export { generateMantra } from './mantras'
export { TZOLKIN_SIGNS, getTzolkinSign } from './tzolkin-signs'
export { TEST_PEOPLE } from './people'

// Phase 3.3: Astrology data
export {
  ZODIAC_SIGNS,
  getZodiacSignByNumber,
  getZodiacSignById,
  getZodiacSignFromLongitude,
  getDegreeInSign,
  getMinuteInDegree,
  formatZodiacPosition,
} from './zodiac-signs'
export {
  PLANETS,
  getPlanetById,
  getPlanetsByType,
  CELESTIAL_BODIES,
  CELESTIAL_POINTS,
  PLANET_TO_LIBRARY_KEY,
} from './planets'
export {
  HOUSES,
  getHouseByNumber,
  getHouseByNaturalSign,
  ANGULAR_HOUSES,
  SUCCEDENT_HOUSES,
  CADENT_HOUSES,
} from './houses'
export {
  ASPECTS,
  getAspectByName,
  getAspectByAngle,
  findAspect,
  getAspectsByNature,
  MAJOR_ASPECTS,
  HARD_ASPECTS,
  SOFT_ASPECTS,
  getAspectColor,
} from './aspects'

// Phase 3.4: Human Design data
export {
  GATES,
  getGate,
  getGatesByCenter,
  GATES_BY_CENTER,
  GATE_TO_CENTER,
  longitudeToGate,
  MANDALA_GATE_SEQUENCE,
  MANDALA_SEQUENCE_FULL,
  getGateDegreeRange,
} from './human-design-gates'

export {
  CHANNELS,
  getChannel,
  getChannelByGates,
  getChannelsForGate,
  getChannelsBetweenCenters,
  getChannelsByCircuitry,
  findDefinedChannels,
  findPotentialChannels,
  GATE_CONNECTIONS,
  areGatesConnected,
} from './human-design-channels'

export {
  CENTERS,
  getCenter,
  MOTOR_CENTERS,
  AWARENESS_CENTERS,
  PRESSURE_CENTERS,
  TYPES,
  getTypeDefinition,
  AUTHORITIES,
  getAuthorityDefinition,
  PROFILES,
  getProfile,
  getProfileByLines,
  LINE_THEMES,
  getLineTheme,
  QUARTER_GATES,
  getQuarterFromGate,
} from './human-design'
