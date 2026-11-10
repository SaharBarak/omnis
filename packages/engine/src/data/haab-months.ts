/**
 * The Haab', the Maya vague year: eighteen months of twenty days and the
 * five days of Wayeb' that close it, 365 in all, each day named by its
 * number in the month (0, the month's "seating", to 19) and the month.
 *
 * Names in the ALMG orthography as Wikipedia's Haab' article sets them
 * after Kettunen and Helmke, *Introduction to Maya Hieroglyphs* (2005,
 * pp. 47–48; https://en.wikipedia.org/wiki/Haab%CA%BC), the spelling the
 * engine's Tzolk'in day signs keep (`tzolkin-signs.ts`: Ak'b'al, Eb', Kib').
 * The 16th-century Yukatek spellings and the Classic Mayan readings are
 * Kettunen and Helmke, *Introduction to Maya Hieroglyphs* (Wayeb, 2020),
 * Tables XII–XIII (https://www.mesoweb.com/resources/handbook/);
 * a reading they query is left out, so a month may have none. The Hebrew
 * transliterations are the app's own.
 */

export interface HaabMonth {
  /** The month's place in the year, 0 (Pop) to 18 (Wayeb'). */
  readonly index: number
  /** Its name in the ALMG orthography. */
  readonly name: string
  /** Its name as 16th-century Yukatek wrote it (Landa's spelling). */
  readonly yukatek: string
  /** The Classic Mayan readings of its glyph that Kettunen and Helmke give without query. */
  readonly classic: readonly string[]
  readonly hebrew: string
  /** Its days: twenty, or Wayeb''s five. */
  readonly days: number
}

/** Days in a month of the Haab', and in Wayeb' that closes it. */
export const HAAB_MONTH_DAYS = 20
export const WAYEB_DAYS = 5

const month = (index: number, name: string, yukatek: string, classic: readonly string[], hebrew: string): HaabMonth =>
  Object.freeze({ index, name, yukatek, classic: Object.freeze([...classic]), hebrew, days: name === "Wayeb'" ? WAYEB_DAYS : HAAB_MONTH_DAYS })

export const HAAB_MONTH_TABLE: readonly HaabMonth[] = Object.freeze([
  month(0, 'Pop', 'Pop', [], 'פופ'),
  month(1, "Wo'", 'Uo', ["Ik'at", 'Wooh(iil)'], 'וו'),
  month(2, 'Sip', 'Zip', ['Chakat'], 'סיפ'),
  month(3, "Sotz'", "Zotz'", ["Suutz'"], 'סוץ'),
  month(4, 'Sek', 'Tzec', ['Kasew', 'Kusew'], 'סק'),
  month(5, 'Xul', 'Xul', [], 'שול'),
  month(6, "Yaxk'in", 'Yaxkin', ["Yaxk'in"], 'יאשקין'),
  month(7, 'Mol', 'Mol', ['Mol', 'Molol', 'Molow'], 'מול'),
  month(8, "Ch'en", "Ch'en", ["Ik'sihom"], "צ'ן"),
  month(9, 'Yax', 'Yax', ['Yaxsihom'], 'יאש'),
  month(10, "Sak'", 'Zac', ['Saksihom'], 'סאק'),
  month(11, 'Keh', 'Ceh', ['Chaksihom'], 'קה'),
  month(12, 'Mak', 'Mac', ['Mak'], 'מאק'),
  month(13, "K'ank'in", 'Kankin', ['Uniw'], 'קנקין'),
  month(14, 'Muwan', 'Muan', ['Muwaan', 'Muwan'], 'מואן'),
  month(15, 'Pax', 'Pax', ['Pax'], 'פאש'),
  month(16, "K'ayab'", 'Kayab', ["K'anasiiy"], 'קאיב'),
  month(17, "Kumk'u", 'Cumku', [], 'קומקו'),
  month(18, "Wayeb'", 'Uayeb', ['Kolajaw'], 'ואייב'),
])

/** Days in the Haab': its eighteen months and Wayeb'. */
export const HAAB_DAYS = HAAB_MONTH_TABLE.reduce((sum, m) => sum + m.days, 0)

/** The month at `index` (0 Pop to 18 Wayeb'). */
export function haabMonth(index: number): HaabMonth {
  const found = HAAB_MONTH_TABLE[index]
  if (!found) throw new RangeError(`Invalid Haab' month: ${index}`)
  return found
}
