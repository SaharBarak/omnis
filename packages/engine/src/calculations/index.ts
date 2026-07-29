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

// Phase 3.5: Gematria
export {
  cleanHebrewText,
  extractHebrewLetters,
  isHebrewChar,
  digitalRoot,
  calculateGematriaValue,
  calculateGematria,
  standardGematria,
  analyzeNameGematria,
  compareNames,
  analyzeGroup,
  findEquivalentMeanings,
  hasNotableMeaning,
  getLetterBreakdown,
  countLetters,
  getGematriaSummary,
  formatGematriaValue,
} from './gematria'

// Moon map
export {
  getMoonReading,
  getLunation,
  getMoonPhaseAngle,
  angleToPhaseIndex,
  MOON_PHASES,
  type MoonReading,
  type Lunation,
  type MoonPhaseName,
} from './moon'
export {
  hijriDate,
  persianDate,
  chineseYear,
  lahiriAyanamsa,
  siderealSun,
  panchang,
  type ChineseYear,
  type SiderealSun,
  type Panchang,
} from './calendars'
export {
  hebrewDateParts,
  upcomingHebrewHolidays,
  HEBREW_HOLIDAYS,
  type HebrewDateParts,
  type HebrewHoliday,
  type UpcomingHoliday,
} from './hebrew-calendar'
export {
  hijriDateParts,
  persianDateParts,
  chineseDateParts,
  upcomingHijriHolidays,
  upcomingPersianHolidays,
  upcomingChineseFestivals,
  HIJRI_HOLIDAYS,
  PERSIAN_HOLIDAYS,
  CHINESE_FESTIVALS,
  type WorldDateParts,
  type WorldHoliday,
  type UpcomingWorldHoliday,
} from './world-calendars'
export {
  thirteenMoonDate,
  thirteenMoonYear,
  MOON_NAMES,
  MOON_TOTEMS,
  PLASMA_NAMES,
  type ThirteenMoonDate,
  type ThirteenMoonKind,
  type ThirteenMoonCell,
  type ThirteenMoonMonth,
} from './thirteen-moon'
export {
  reduceNumber,
  lifePathNumber,
  birthdayNumber,
  expressionNumber,
  soulUrgeNumber,
  personalityNumber,
  maturityNumber,
  pinnacles,
  challenges,
  personalYearNumber,
  personalMonthNumber,
  personalDayNumber,
  numerologyCompatibility,
  numerologyChart,
  NUMBER_MEANINGS,
  type Pinnacle,
  type NumerologyChart,
  type NumerologyCompatibility,
  type NumerologyHarmony,
} from './numerology'
