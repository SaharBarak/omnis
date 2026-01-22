export { isLeapYear, gregorianToJDN, parseDate } from './julian'
export { dateToKin, kinToSeal, kinToTone } from './dreamspell'
export { calculateOracle } from './oracle'
export { dateToTzolkin, getTzolkinSealNumber, getTzolkinTone } from './tzolkin'

// Phase 3.1: Dreamspell Full Depth
export {
  kinToWavespellNumber,
  kinToWavespell,
  getWavespell,
  getWavespellStartKin,
  getWavespellEndKin,
  getWavespellSeal,
  getWavespellPosition,
  getWavespellKins,
  getWavespellRole,
  getAllWavespells,
  getCurrentWavespellInfo,
  type Wavespell,
  type WavespellPosition,
} from './wavespell'

export {
  getCastle,
  kinToCastleNumber,
  kinToCastle,
  getCastleKins,
  getCastleWavespellDetails,
  getAllCastles,
  getEarthFamily,
  getAllEarthFamilies,
  getColorFamily,
  getAllColorFamilies,
  getHarmonic,
  kinToHarmonicNumber,
  kinToHarmonic,
  getKinCycleInfo,
  getTzolkinCycleDay,
  type Castle,
  type CastleColor,
  type EarthFamily,
  type ColorFamily_Group,
  type Harmonic,
  type CycleInfo,
} from './cycles'

export {
  getDreamspellYearStart,
  getDreamspellYearEnd,
  getYearBearerKin,
  getYearBearer,
  getDreamspellYear,
  getDateDreamspellYear,
  getGalacticBirthday,
  getNextGalacticReturn,
  getGalacticReturns,
  getPersonalYear,
  getCurrentPersonalYear,
  getPersonalCyclePosition,
  type DreamspellYear,
  type GalacticBirthday,
  type PersonalYear,
} from './yearly'

// Phase 3.2: Long Count
export {
  jdnToLongCount,
  longCountToJDN,
  dateToLongCount,
  jdnToGregorian,
  jdnToHaab,
  dateToHaab,
  getCalendarRound,
  getLongCountData,
  formatLongCount,
  parseLongCount,
  isValidLongCount,
  daysSinceCreation,
  calculatePersonalMayanDates,
  addToLongCount,
  longCountDifference,
  getCurrentLongCount,
  getCurrentLongCountData,
  HAAB_MONTHS,
  HAAB_MONTHS_HEBREW,
  HISTORICAL_DATES,
  type LongCount,
  type Haab,
  type CalendarRound,
  type LongCountData,
  type PersonalMayanDates,
  type TunBirthday,
  type KatunBirthday,
  type CalendarRoundReturn,
  type HistoricalDate,
} from './long-count'

// Phase 3.3: Astrology
export {
  calculateNatalChart,
  calculateSunSignChart,
  getSunSign,
  getApproximateSunSign,
  getCurrentPlanetaryPositions,
  formatPlanetPosition,
  getChartSummary,
} from './astrology'

// Phase 3.4: Human Design
export {
  calculateBodygraph,
  isCompleteBodygraph,
  getAllGates,
  getPersonalityGates,
  getDesignGates,
  isPersonalityGate,
  isDesignGate,
  getGateActivation,
  getBodygraphSummary,
  formatGateActivation,
  getPlanetsForGate,
} from './human-design'
