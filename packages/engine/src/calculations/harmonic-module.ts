/**
 * The Tzolk'in as Dreamspell lays it, the Harmonic Module (Argüelles,
 * *Dreamspell*, 1990): the 260 kins in thirteen columns of twenty, kin 1 at
 * the top of the first column and each column read down, so a row holds one
 * seal and a column twenty consecutive days. On it lie the fifty-two
 * galactic activation portals, the Loom of Maya, and down its middle the
 * mystic column. The oracle's kins are found on it by their seal and tone.
 */

import { asKin, type Kin, type SealNumber, type ToneNumber } from '../core/types'
import { getAnalog, getAntipode, getGuide, getOccult, getOccultTone } from '../data/oracle-tables'
import { SEALS } from '../data/seals'
import { TONES } from '../data/tones'
import { kinToSeal, kinToTone } from './dreamspell'

export const MODULE_ROWS = SEALS.length
export const MODULE_COLUMNS = TONES.length
export const KINS = MODULE_ROWS * MODULE_COLUMNS

/** A kin's place on the module, both counted from 1: its column of twenty consecutive kins and its row, the seal's. */
export const modulePlace = (kin: number): { readonly column: number; readonly row: number } => ({
  column: Math.ceil(kin / MODULE_ROWS),
  row: ((kin - 1) % MODULE_ROWS) + 1,
})

/** The mystic column: the module's middle column, kins 121 to 140. */
export const MYSTIC_COLUMN = Math.ceil(MODULE_COLUMNS / 2)
export const isMysticColumn = (kin: number): boolean => modulePlace(kin).column === MYSTIC_COLUMN

/**
 * The fifty-two galactic activation portals (Dreamspell's Loom of Maya), as
 * the harmonic module prints them; the pattern is symmetric about the
 * module's centre (kin k and kin 261 − k), and holds the two inner columns'
 * middle ten (106–115, 146–155), as published charts show (e.g.
 * https://mayankin.com/wp-content/uploads/2022/08/MayanKin-Mariela-Maya-Tzolkin-Blue-Castle-of-Transformation-Cycle-051922.pdf).
 */
const PORTALS: readonly number[] = [
  1, 20, 22, 39, 43, 50, 51, 58, 64, 69, 72, 77, 85, 88, 93, 96, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 146, 147, 148, 149, 150, 151, 152, 153, 154, 155,
  165, 168, 173, 176, 184, 189, 192, 197, 203, 210, 211, 218, 222, 239, 241, 260,
]
export const GALACTIC_ACTIVATION_PORTALS: ReadonlySet<number> = new Set(PORTALS)
export const isPortal = (kin: number): boolean => GALACTIC_ACTIVATION_PORTALS.has(kin)

/**
 * The kin of a seal and tone: the one day of the 260 that is both, by the
 * Chinese remainder theorem over 20 and 13 (221 is 1 mod 20 and 0 mod 13;
 * 40 is 0 mod 20 and 1 mod 13).
 */
export function kinOf(seal: number, tone: number): Kin {
  return asKin(((((seal - 1) * 221 + (tone - 1) * 40) % KINS) + KINS) % KINS + 1)
}

/** The fifth-force oracle as kins: the guide, analog and antipode carry the kin's tone; the occult the tone that sums with it to fourteen. */
export interface OracleKins {
  readonly destiny: Kin
  readonly guide: Kin
  readonly analog: Kin
  readonly antipode: Kin
  readonly occult: Kin
}

export function oracleKins(kin: Kin): OracleKins {
  const seal: SealNumber = kinToSeal(kin)
  const tone: ToneNumber = kinToTone(kin)
  return {
    destiny: kin,
    guide: kinOf(getGuide(seal, tone), tone),
    analog: kinOf(getAnalog(seal), tone),
    antipode: kinOf(getAntipode(seal), tone),
    occult: kinOf(getOccult(seal), getOccultTone(tone)),
  }
}
