/**
 * Where the seals' glyphs come from: the Maya day signs on Wikimedia Commons
 * (`MAYA-g-log-cal-DNN-<Name>.svg`, after CJLL Wright's drawings), one per
 * day in the count's order, so day NN is seal NN. Commons spells the days in
 * the modern orthography; the engine keeps the colonial one (`SEALS`), so the
 * spelling is data here and the number is the join.
 * `scripts/design/day-signs.ts` syncs the files and records each one's
 * author and licence as Commons states them (`day-signs.sources.json`);
 * seal-glyphs.test.ts holds each file to its seal and its source.
 */

/** Licences a day sign may carry: free for commercial use, with attribution. */
export const DAY_SIGN_LICENSES: ReadonlySet<string> = new Set(['CC BY-SA 4.0', 'CC BY-SA 3.0', 'CC BY 4.0', 'CC BY 2.5', 'CC0', 'Public domain'])

/** One seal glyph's source, as the sync recorded it from Commons. */
export interface DaySignSource {
  readonly seal: number
  readonly file: string
  readonly page: string
  readonly author: string
  readonly license: string
  readonly licenseUrl: string
}

/**
 * Each day's file on Commons, by its name there, in the count's order (Imix
 * first): the standard inscription form, traced by potrace so its counters are
 * cut out and it paints one ink. Ok's plain file is layered black and white
 * paint, which a mask reads as a solid block, so Ok takes its `_b` trace.
 */
const COMMONS_DAYS = [
  'Imix', 'Ik', 'Akbal', 'Kan', 'Chikchan', 'Kimi', 'Manik', 'Lamat', 'Muluk', 'Ok_b',
  'Chuwen', 'Eb', 'Ben', 'Ix', 'Men', 'Kib', 'Kaban', 'Etznab', 'Kawak', 'Ajaw',
] as const

const pad = (n: number): string => String(n).padStart(2, '0')

/** The Commons file holding seal `n`'s day sign. */
export const daySignFile = (n: number): string => `MAYA-g-log-cal-D${pad(n)}-${COMMONS_DAYS[n - 1]}.svg`

/** The Commons page that credits and licenses seal `n`'s day sign. */
export const daySignPage = (n: number): string => `https://commons.wikimedia.org/wiki/File:${daySignFile(n)}`
