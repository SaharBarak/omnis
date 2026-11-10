/**
 * The Hebrew months, from Tishrei as the civil year counts them, each with
 * the names Intl's Hebrew calendar gives it (ICU spelling: Tishri, Heshvan,
 * Tamuz) and what Sefer Yetzirah sets over it: its simple letter, the
 * faculty the letter is king over, and its sign of the zodiac.
 *
 * Sefer Yetzirah, Gra version, 5:1–10 (Warsaw 1884, public domain; read at
 * https://www.sefaria.org/Sefer_Yetzirah_Gra_Version.5): "He made the letter
 * Heh king over speech … and formed with them Aries in the universe, Nisan in
 * the year". One version only, so the table never mixes readings; the
 * faculties are glossed here from the Hebrew (שיחה speech, הרהור thought,
 * הלוך walking, ראיה sight, שמיעה hearing, מעשה action, תשמיש coition, ריח
 * smell, שינה sleep, רוגז anger, לעיטה swallowing, שחוק laughter). The text
 * names twelve months; a leap year's two Adars both stand under Adar's.
 */

/** A month by its place in the year: `adar` is the common year's Adar and the leap year's Adar II, which keeps Adar's days (Purim, the fast of Esther). */
export type HebrewMonthId =
  | 'tishrei'
  | 'cheshvan'
  | 'kislev'
  | 'tevet'
  | 'shevat'
  | 'adar1'
  | 'adar'
  | 'nisan'
  | 'iyar'
  | 'sivan'
  | 'tammuz'
  | 'av'
  | 'elul'

export interface HebrewMonth {
  readonly id: HebrewMonthId
  /** The names Intl's en Hebrew calendar gives the month (Adar II in a leap year, Adar in a common one). */
  readonly intl: readonly string[]
  /** The simple letter Sefer Yetzirah sets over it. */
  readonly letter: string
  /** The faculty that letter is king over, in Hebrew and in English. */
  readonly faculty: { readonly hebrew: string; readonly english: string }
  /** Its sign, 0 for Aries (Nisan) to 11 for Pisces (Adar). */
  readonly sign: number
}

export const HEBREW_MONTHS: readonly HebrewMonth[] = Object.freeze([
  { id: 'tishrei', intl: ['Tishri'], letter: 'ל', faculty: { hebrew: 'תשמיש', english: 'coition' }, sign: 6 },
  { id: 'cheshvan', intl: ['Heshvan'], letter: 'נ', faculty: { hebrew: 'ריח', english: 'smell' }, sign: 7 },
  { id: 'kislev', intl: ['Kislev'], letter: 'ס', faculty: { hebrew: 'שינה', english: 'sleep' }, sign: 8 },
  { id: 'tevet', intl: ['Tevet'], letter: 'ע', faculty: { hebrew: 'רוגז', english: 'anger' }, sign: 9 },
  { id: 'shevat', intl: ['Shevat'], letter: 'צ', faculty: { hebrew: 'לעיטה', english: 'swallowing' }, sign: 10 },
  { id: 'adar1', intl: ['Adar I'], letter: 'ק', faculty: { hebrew: 'שחוק', english: 'laughter' }, sign: 11 },
  { id: 'adar', intl: ['Adar', 'Adar II'], letter: 'ק', faculty: { hebrew: 'שחוק', english: 'laughter' }, sign: 11 },
  { id: 'nisan', intl: ['Nisan'], letter: 'ה', faculty: { hebrew: 'שיחה', english: 'speech' }, sign: 0 },
  { id: 'iyar', intl: ['Iyar'], letter: 'ו', faculty: { hebrew: 'הרהור', english: 'thought' }, sign: 1 },
  { id: 'sivan', intl: ['Sivan'], letter: 'ז', faculty: { hebrew: 'הלוך', english: 'walking' }, sign: 2 },
  { id: 'tammuz', intl: ['Tamuz'], letter: 'ח', faculty: { hebrew: 'ראיה', english: 'sight' }, sign: 3 },
  { id: 'av', intl: ['Av'], letter: 'ט', faculty: { hebrew: 'שמיעה', english: 'hearing' }, sign: 4 },
  { id: 'elul', intl: ['Elul'], letter: 'י', faculty: { hebrew: 'מעשה', english: 'action' }, sign: 5 },
])

/** The month Intl names `intl` (Heshvan, Adar II), or undefined for a name outside the table. */
export const hebrewMonthNamed = (intl: string): HebrewMonth | undefined => HEBREW_MONTHS.find((m) => m.intl.includes(intl))
