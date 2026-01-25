export { SEALS, getSeal } from './seals'
export { TONES, getTone } from './tones'
export { getAnalog, getAntipode, getOccult, getGuide } from './oracle-tables'
export { generateMantra } from './mantras'
export { TZOLKIN_SIGNS, getTzolkinSign } from './tzolkin-signs'
export { TEST_PEOPLE } from './people'

// Wavespell and Castle data
export {
  WAVESPELLS,
  getWavespellData,
  getWavespellBySeal,
  getWavespellByKin,
} from './wavespells'
export type { WavespellData } from './wavespells'

export {
  CASTLES,
  getCastleData,
  getCastleByKin,
  getCastleByWavespell,
  getCastleColor,
  getCastleWavespellNumbers,
} from './castles'
export type { CastleData, CastleColor } from './castles'

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

// Phase 3.5: Gematria data
export {
  HEBREW_LETTERS,
  FINAL_LETTER_FORMS,
  LETTER_BY_CHAR,
  FINAL_BY_CHAR,
  LETTER_BY_ID,
  ALL_HEBREW_CHARS,
  NOTABLE_NUMBERS,
  NOTABLE_BY_VALUE,
  getLetterById,
  getLetterByChar,
  getFinalByChar,
  isHebrewLetter,
  isFinalForm,
  getNotableNumber,
  getAtBashPair,
  getAvgadLetter,
  getAlbamPair,
} from './hebrew-letters'
export type { FinalLetterForm } from './hebrew-letters'
