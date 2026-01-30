import type { SealNumber } from '../../core/types'

// Analog pairs from DREAMSPELL_SPEC.md (authoritative)
// Dragon <-> Earth, Wind <-> Storm, etc.
const ANALOG_PAIRS: ReadonlyMap<number, number> = new Map([
  [1, 17], [17, 1],   // Dragon <-> Earth
  [2, 19], [19, 2],   // Wind <-> Storm
  [3, 18], [18, 3],   // Night <-> Mirror
  [4, 8],  [8, 4],    // Seed <-> Star
  [5, 10], [10, 5],   // Serpent <-> Dog
  [6, 7],  [7, 6],    // World-Bridger <-> Hand
  [9, 14], [14, 9],   // Moon <-> Wizard
  [11, 12], [12, 11], // Monkey <-> Human
  [13, 20], [20, 13], // Skywalker <-> Sun
  [15, 16], [16, 15], // Eagle <-> Warrior
])

export function getAnalog(seal: SealNumber): SealNumber {
  const analog = ANALOG_PAIRS.get(seal)
  if (analog === undefined) {
    throw new RangeError(`Invalid seal number: ${seal}`)
  }
  return analog as SealNumber
}

export function getAntipode(seal: SealNumber): SealNumber {
  return (((seal - 1 + 10) % 20) + 1) as SealNumber
}

export function getOccult(seal: SealNumber): SealNumber {
  return (21 - seal) as SealNumber
}

// Occult tone formula per DREAMSPELL_SPEC.md line 151:
// Tone = 14 - originalTone (if 0, use 13)
export function getOccultTone(tone: number): number {
  const result = 14 - tone
  return result === 0 ? 13 : result
}

// Guide offset by tone group
// Tones 1, 6, 11 -> offset 0 (same seal)
// Tones 2, 7, 12 -> offset 12
// Tones 3, 8, 13 -> offset 4
// Tones 4, 9     -> offset 16
// Tones 5, 10    -> offset 8
const GUIDE_OFFSETS = [0, 12, 4, 16, 8] as const

export function getGuide(seal: SealNumber, tone: number): SealNumber {
  const guideOffset = GUIDE_OFFSETS[(tone - 1) % 5]
  return (((seal - 1 + guideOffset) % 20) + 1) as SealNumber
}
