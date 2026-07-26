import { asKin, type Kin, type SealNumber } from '../types/core'
import type { ColorFamily } from '../types/common'
import { dateToKin, kinToSeal } from './dreamspell'
import { kinToWavespellNumber, getWavespell, type Wavespell } from './wavespell'

// The 260-day Tzolkin is divided into 5 Castles of 52 days each
// Each castle contains 4 wavespells

export type CastleColor = ColorFamily | 'green'

export interface Castle {
  number: number          // 1-5
  color: CastleColor      // red, white, blue, yellow, green
  name: string            // Descriptive name
  startKin: Kin           // First kin (1, 53, 105, 157, 209)
  endKin: Kin             // Last kin (52, 104, 156, 208, 260)
  wavespells: readonly number[] // 4 wavespell numbers
  theme: string           // Castle theme/energy
}

const CASTLE_DATA: readonly Omit<Castle, 'wavespells'>[] = Object.freeze([
  {
    number: 1,
    color: 'red' as CastleColor,
    name: 'Castle of Turning',
    startKin: asKin(1),
    endKin: asKin(52),
    theme: 'Initiation - The court of birth',
  },
  {
    number: 2,
    color: 'white' as CastleColor,
    name: 'Castle of Crossing',
    startKin: asKin(53),
    endKin: asKin(104),
    theme: 'Refinement - The court of death',
  },
  {
    number: 3,
    color: 'blue' as CastleColor,
    name: 'Castle of Burning',
    startKin: asKin(105),
    endKin: asKin(156),
    theme: 'Transformation - The court of magic',
  },
  {
    number: 4,
    color: 'yellow' as CastleColor,
    name: 'Castle of Giving',
    startKin: asKin(157),
    endKin: asKin(208),
    theme: 'Ripening - The court of intelligence',
  },
  {
    number: 5,
    color: 'green' as CastleColor,
    name: 'Castle of Enchantment',
    startKin: asKin(209),
    endKin: asKin(260),
    theme: 'Matrix - The court of synchronization',
  },
])

function getCastleWavespells(castleNumber: number): readonly number[] {
  const startWavespell = (castleNumber - 1) * 4 + 1
  return Object.freeze([
    startWavespell,
    startWavespell + 1,
    startWavespell + 2,
    startWavespell + 3,
  ])
}

export function getCastle(castleNumber: number): Castle {
  if (castleNumber < 1 || castleNumber > 5) {
    throw new RangeError(`Invalid castle number: ${castleNumber}`)
  }
  const data = CASTLE_DATA[castleNumber - 1]
  return {
    ...data,
    wavespells: getCastleWavespells(castleNumber),
  }
}

export function kinToCastleNumber(kin: Kin): number {
  // Castle 1 = Kin 1-52, Castle 2 = Kin 53-104, etc.
  return Math.ceil(kin / 52)
}

export function kinToCastle(kin: Kin): Castle {
  return getCastle(kinToCastleNumber(kin))
}

export function getCastleKins(castleNumber: number): readonly Kin[] {
  if (castleNumber < 1 || castleNumber > 5) {
    throw new RangeError(`Invalid castle number: ${castleNumber}`)
  }
  const startKin = (castleNumber - 1) * 52 + 1
  return Object.freeze(
    Array.from({ length: 52 }, (_, i) => asKin(startKin + i))
  )
}

export function getCastleWavespellDetails(castleNumber: number): readonly Wavespell[] {
  const wavespellNumbers = getCastleWavespells(castleNumber)
  return Object.freeze(wavespellNumbers.map(n => getWavespell(n)))
}

export function getAllCastles(): readonly Castle[] {
  return Object.freeze(
    Array.from({ length: 5 }, (_, i) => getCastle(i + 1))
  )
}

// Earth Families - groups of 4 seals that share a common purpose
export interface EarthFamily {
  name: string
  seals: readonly SealNumber[]
  chakra: string
  direction: string
  function: string
}

const EARTH_FAMILIES: readonly EarthFamily[] = Object.freeze([
  {
    name: 'Polar',
    seals: Object.freeze([1, 6, 11, 16] as SealNumber[]), // Dragon, World-Bridger, Monkey, Warrior
    chakra: 'Crown',
    direction: 'North',
    function: 'Receives - Information receivers',
  },
  {
    name: 'Cardinal',
    seals: Object.freeze([2, 7, 12, 17] as SealNumber[]), // Wind, Hand, Human, Earth
    chakra: 'Throat',
    direction: 'East',
    function: 'Transmits - Information transmitters',
  },
  {
    name: 'Core',
    seals: Object.freeze([3, 8, 13, 18] as SealNumber[]), // Night, Star, Skywalker, Mirror
    chakra: 'Heart',
    direction: 'Center',
    function: 'Transduces - Information processors',
  },
  {
    name: 'Signal',
    seals: Object.freeze([4, 9, 14, 19] as SealNumber[]), // Seed, Moon, Wizard, Storm
    chakra: 'Solar Plexus',
    direction: 'South',
    function: 'Signals - Provides timing frequency',
  },
  {
    name: 'Gateway',
    seals: Object.freeze([5, 10, 15, 20] as SealNumber[]), // Serpent, Dog, Eagle, Sun
    chakra: 'Root',
    direction: 'West',
    function: 'Opens - Galactic portal activators',
  },
])

export function getEarthFamily(sealNumber: SealNumber): EarthFamily {
  const familyIndex = (sealNumber - 1) % 5
  return EARTH_FAMILIES[familyIndex]
}

export function getAllEarthFamilies(): readonly EarthFamily[] {
  return EARTH_FAMILIES
}

// Color families - groups of 5 seals of the same color
export interface ColorFamily_Group {
  color: ColorFamily
  seals: readonly SealNumber[]
  direction: string
  action: string
}

const COLOR_FAMILIES: readonly ColorFamily_Group[] = Object.freeze([
  {
    color: 'red',
    seals: Object.freeze([1, 5, 9, 13, 17] as SealNumber[]),
    direction: 'East',
    action: 'Initiates',
  },
  {
    color: 'white',
    seals: Object.freeze([2, 6, 10, 14, 18] as SealNumber[]),
    direction: 'North',
    action: 'Refines',
  },
  {
    color: 'blue',
    seals: Object.freeze([3, 7, 11, 15, 19] as SealNumber[]),
    direction: 'West',
    action: 'Transforms',
  },
  {
    color: 'yellow',
    seals: Object.freeze([4, 8, 12, 16, 20] as SealNumber[]),
    direction: 'South',
    action: 'Ripens',
  },
])

export function getColorFamily(sealNumber: SealNumber): ColorFamily_Group {
  const colorIndex = (sealNumber - 1) % 4
  return COLOR_FAMILIES[colorIndex]
}

export function getAllColorFamilies(): readonly ColorFamily_Group[] {
  return COLOR_FAMILIES
}

// Harmonic - group of 4 consecutive kins (there are 65 harmonics in a Tzolkin)
export interface Harmonic {
  number: number    // 1-65
  startKin: Kin
  endKin: Kin
  colorSequence: readonly ColorFamily[] // Always red, white, blue, yellow
}

export function getHarmonic(harmonicNumber: number): Harmonic {
  if (harmonicNumber < 1 || harmonicNumber > 65) {
    throw new RangeError(`Invalid harmonic number: ${harmonicNumber}`)
  }
  const startKin = asKin((harmonicNumber - 1) * 4 + 1)
  const endKin = asKin(harmonicNumber * 4)
  return {
    number: harmonicNumber,
    startKin,
    endKin,
    colorSequence: Object.freeze(['red', 'white', 'blue', 'yellow'] as ColorFamily[]),
  }
}

export function kinToHarmonicNumber(kin: Kin): number {
  return Math.ceil(kin / 4)
}

export function kinToHarmonic(kin: Kin): Harmonic {
  return getHarmonic(kinToHarmonicNumber(kin))
}

// Get comprehensive cycle information for a kin
export interface CycleInfo {
  kin: Kin
  castle: Castle
  castlePosition: number        // Position within castle (1-52)
  wavespellNumber: number
  wavespellPosition: number     // Position within wavespell (1-13)
  harmonic: Harmonic
  harmonicPosition: number      // Position within harmonic (1-4)
  earthFamily: EarthFamily
  colorFamily: ColorFamily_Group
}

export function getKinCycleInfo(kin: Kin): CycleInfo {
  const seal = kinToSeal(kin)
  const castle = kinToCastle(kin)
  const harmonic = kinToHarmonic(kin)

  return {
    kin,
    castle,
    castlePosition: kin - castle.startKin + 1,
    wavespellNumber: kinToWavespellNumber(kin),
    wavespellPosition: ((kin - 1) % 13) + 1,
    harmonic,
    harmonicPosition: ((kin - 1) % 4) + 1,
    earthFamily: getEarthFamily(seal),
    colorFamily: getColorFamily(seal),
  }
}

// Calculate current position in Tzolkin cycle relative to a reference date
export function getTzolkinCycleDay(dateStr: string): number {
  const kin = dateToKin(dateStr)
  return kin as number // Kin number IS the day in the 260-day cycle
}
