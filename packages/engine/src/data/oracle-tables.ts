import type { SealNumber } from '../types/branded'

/**
 * Analog (the supportive position): the two seals sum to 19.
 *
 *   S_analog ≡ 19 − S  (mod 20)
 *
 * Stated as a table that is: 1↔18, 2↔17, 3↔16, 4↔15, 5↔14, 6↔13, 7↔12, 8↔11,
 * 9↔10, and 19↔20. (The 19↔20 pair looks like an exception to "sum to 19" only
 * because the rule is stated in 1..20 arithmetic; mod 20 it falls out for free,
 * which is why this is a formula and not a hand-written map.)
 *
 * The structural check that proves it: analog must swap Red↔White and
 * Blue↔Yellow (colour = ((S−1) mod 4) + 1). Summing to 19 does exactly that —
 * a Red seal (S ≡ 1 mod 4) maps to 19−S ≡ 2 mod 4, which is White. Antipode
 * (S+10) gives Red↔Blue and occult (21−S) gives Red↔Yellow, so the three
 * relations realize the three distinct ways of pairing the four colours, with
 * nothing left over.
 *
 * HISTORY — this was previously a hardcoded map citing "DREAMSPELL_SPEC.md
 * (authoritative)". That file does not exist in this repository. The map was
 * wrong: its pairs had no consistent sum (1↔17 sums to 18, 2↔19 to 21, 13↔20
 * to 33) and it broke the colour rule outright, mapping Red→Red and
 * White→Blue. Every `analog` this engine has ever emitted was incorrect.
 * See docs/redesign/CONNECTION_ATLAS.md §3.
 */
export function getAnalog(seal: SealNumber): SealNumber {
  if (!Number.isInteger(seal) || seal < 1 || seal > 20) {
    throw new RangeError(`Invalid seal number: ${seal}`)
  }
  return ((((19 - seal) % 20) + 20) % 20 || 20) as SealNumber
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
