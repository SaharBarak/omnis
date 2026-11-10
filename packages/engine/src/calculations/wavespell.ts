import { asKin, asSeal, type Kin, type SealNumber, type ToneNumber } from '../core/types'
import { kinToSeal, kinToTone } from './dreamspell'

// A wavespell is a 13-day cycle starting with Tone 1 (Magnetic) and ending with Tone 13 (Cosmic)
// There are 20 wavespells in the 260-day Tzolkin cycle

export interface Wavespell {
  number: number        // 1-20
  sealNumber: SealNumber  // The seal that defines this wavespell
  startKin: Kin         // First kin of the wavespell
  endKin: Kin           // Last kin of the wavespell
}

export interface WavespellPosition {
  wavespell: Wavespell
  position: ToneNumber  // Position within wavespell (1-13), same as tone
  dayName: string       // Role name for this position in the wavespell
}

// The 13 positions within a wavespell and their roles
const WAVESPELL_ROLES: readonly string[] = Object.freeze([
  'Purpose',      // Tone 1: Magnetic - Sets the purpose/theme
  'Challenge',    // Tone 2: Lunar - Identifies the challenge
  'Service',      // Tone 3: Electric - Activates service
  'Form',         // Tone 4: Self-Existing - Defines the form
  'Radiance',     // Tone 5: Overtone - Commands radiance
  'Equality',     // Tone 6: Rhythmic - Organizes equality
  'Attunement',   // Tone 7: Resonant - Channels attunement (center of wavespell)
  'Integrity',    // Tone 8: Galactic - Models integrity
  'Intention',    // Tone 9: Solar - Realizes intention
  'Manifestation', // Tone 10: Planetary - Perfects manifestation
  'Liberation',   // Tone 11: Spectral - Releases/dissolves
  'Cooperation',  // Tone 12: Crystal - Dedicates cooperation
  'Presence',     // Tone 13: Cosmic - Transcends, magic flight
])

export function getWavespellRole(position: ToneNumber): string {
  return WAVESPELL_ROLES[position - 1]
}

export function kinToWavespellNumber(kin: Kin): number {
  // Wavespell 1 = Kin 1-13, Wavespell 2 = Kin 14-26, etc.
  return Math.ceil(kin / 13)
}

export function getWavespellStartKin(wavespellNumber: number): Kin {
  if (wavespellNumber < 1 || wavespellNumber > 20) {
    throw new RangeError(`Invalid wavespell number: ${wavespellNumber}`)
  }
  return asKin((wavespellNumber - 1) * 13 + 1)
}

export function getWavespellEndKin(wavespellNumber: number): Kin {
  if (wavespellNumber < 1 || wavespellNumber > 20) {
    throw new RangeError(`Invalid wavespell number: ${wavespellNumber}`)
  }
  return asKin(wavespellNumber * 13)
}

export function getWavespellSeal(wavespellNumber: number): SealNumber {
  // The wavespell seal is the seal of the first kin (Magnetic tone)
  const startKin = getWavespellStartKin(wavespellNumber)
  return kinToSeal(startKin)
}

export function getWavespell(wavespellNumber: number): Wavespell {
  if (wavespellNumber < 1 || wavespellNumber > 20) {
    throw new RangeError(`Invalid wavespell number: ${wavespellNumber}`)
  }
  return {
    number: wavespellNumber,
    sealNumber: getWavespellSeal(wavespellNumber),
    startKin: getWavespellStartKin(wavespellNumber),
    endKin: getWavespellEndKin(wavespellNumber),
  }
}

export function kinToWavespell(kin: Kin): Wavespell {
  const wavespellNumber = kinToWavespellNumber(kin)
  return getWavespell(wavespellNumber)
}

export function getWavespellPosition(kin: Kin): WavespellPosition {
  const wavespell = kinToWavespell(kin)
  const position = kinToTone(kin) // Position in wavespell equals tone
  return {
    wavespell,
    position,
    dayName: getWavespellRole(position),
  }
}

export function getWavespellKins(wavespellNumber: number): readonly Kin[] {
  if (wavespellNumber < 1 || wavespellNumber > 20) {
    throw new RangeError(`Invalid wavespell number: ${wavespellNumber}`)
  }
  const startKin = (wavespellNumber - 1) * 13 + 1
  return Object.freeze(
    Array.from({ length: 13 }, (_, i) => asKin(startKin + i))
  )
}

export function getAllWavespells(): readonly Wavespell[] {
  return Object.freeze(
    Array.from({ length: 20 }, (_, i) => getWavespell(i + 1))
  )
}

// Get the wavespell that a person is currently in based on their kin
export function getCurrentWavespellInfo(kin: Kin): {
  wavespell: Wavespell
  position: WavespellPosition
  kinsRemaining: number
  isAtStart: boolean
  isAtCenter: boolean
  isAtEnd: boolean
} {
  const wavespell = kinToWavespell(kin)
  const position = getWavespellPosition(kin)
  const kinsRemaining = wavespell.endKin - kin

  return {
    wavespell,
    position,
    kinsRemaining,
    isAtStart: position.position === 1,
    isAtCenter: position.position === 7, // Resonant tone is the center
    isAtEnd: position.position === 13,
  }
}

/**
 * The wavespell's four pulsars (Argüelles, *Dreamspell* Journey Book): the
 * thirteen tones grouped four apart, each a dimension of the wavespell: the
 * time pulsar (tones 1, 5, 9, 13, fourth-dimensional), the life pulsar
 * (2, 6, 10, first), the sense pulsar (3, 7, 11, second) and the mind pulsar
 * (4, 8, 12, third). A tone's pulsar is its remainder by four.
 */
export interface Pulsar {
  readonly name: 'Time' | 'Life' | 'Sense' | 'Mind'
  readonly dimension: 1 | 2 | 3 | 4
}

const PULSARS: readonly Pulsar[] = Object.freeze([
  { name: 'Mind', dimension: 3 },
  { name: 'Time', dimension: 4 },
  { name: 'Life', dimension: 1 },
  { name: 'Sense', dimension: 2 },
])

export function tonePulsar(tone: number): Pulsar {
  const pulsar = PULSARS[tone % PULSARS.length]
  if (!pulsar) throw new RangeError(`Invalid tone: ${tone}`)
  return pulsar
}
