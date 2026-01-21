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
