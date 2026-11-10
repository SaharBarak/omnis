/**
 * The nine Lords of the Night: the cycle of nine days the inscriptions
 * record as glyph G of the Supplementary Series, between the Tzolk'in and
 * the Haab' of an Initial Series. Their Classic names are not read, so they
 * go by the glyphs' labels, G1 to G9. The cycle runs unbroken from the era
 * base, so G9 rules every period ending (every day whose count of days is a
 * multiple of nine, as every tun's is). Kettunen and Helmke, *Introduction
 * to Maya Hieroglyphs* (Wayeb, 2020), Table VIII and its worked table of
 * 9.8.19.17.14 to 9.9.0.1.4 (9.9.0.0.0 3 Ajaw 3 Sotz' G9); Thompson, *Maya
 * Hieroglyphic Writing* (1950).
 */

export const LORDS_OF_THE_NIGHT = 9

export interface LordOfTheNight {
  /** 1 to 9. */
  readonly n: number
  /** Its glyph's label, "G1" to "G9". */
  readonly glyph: string
}

/** The Lord of the Night `days` after the era base: G9 on the base and on every ninth day from it. */
export function lordOfTheNight(days: number): LordOfTheNight {
  const n = ((((days - 1) % LORDS_OF_THE_NIGHT) + LORDS_OF_THE_NIGHT) % LORDS_OF_THE_NIGHT) + 1
  return { n, glyph: `G${n}` }
}
