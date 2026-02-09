/**
 * Helper utilities for Dreamspell image assets from starroot.com
 * Assets located in /public/dreamspell/gifs/
 */

/** Get the path to a seal glyph image (1-20) */
export function getSealGlyphPath(sealNumber: number): string {
  return `/dreamspell/gifs/glyph${sealNumber}.gif`
}

/** Get the path to a small (30x30) seal glyph image (1-20) */
export function getSmallSealGlyphPath(sealNumber: number): string {
  return `/dreamspell/gifs/s30x30.glyph${sealNumber}.gif`
}

/** Get the path to a tone image (1-13) */
export function getToneGlyphPath(toneNumber: number): string {
  return `/dreamspell/gifs/tone${toneNumber}.gif`
}

/** Get the path to a moon phase image (1-28) */
export function getMoonPhasePath(phase: number): string {
  return `/dreamspell/gifs/moonImages/moon${phase}.gif`
}

/** Get the path to a Haab month glyph (0-18) */
export function getHaabGlyphPath(month: number): string {
  return `/dreamspell/gifs/Haab/Haab${month}.png`
}

/** Get the path to a Long Count numeral (0-19) */
export function getLongCountNumeralPath(value: number): string {
  return `/dreamspell/gifs/LongCount/LongCount${value}.png`
}

/** Get the path to a Long Count period label */
export function getLongCountLabelPath(period: 'Baktun' | 'Katun' | 'Tun' | 'Winal' | 'Kin'): string {
  return `/dreamspell/gifs/LongCount/${period}.png`
}

/** Get the path to a Maya Tzolkin day sign glyph (1-20) */
export function getMayaTzolkinGlyphPath(sign: number): string {
  return `/dreamspell/gifs/MayaTzolkin/MayaTzolkin${sign}.png`
}

/** Get the Hunab Ku symbol path */
export function getHunabKuPath(): string {
  return `/dreamspell/gifs/HunabKu.png`
}

/** Get the tower background path */
export function getTowerBackgroundPath(): string {
  return `/dreamspell/gifs/towerBackground.gif`
}

/** Get the Mayan ruins background path */
export function getMayanRuinsPath(): string {
  return `/dreamspell/gifs/mayan-ruins.jpg`
}
