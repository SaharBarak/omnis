/**
 * The Hebrew year's holidays, fasts and the State of Israel's days, each on
 * its day of its month with the rules that move it, as the rabbinic
 * calendar and Israeli law set them:
 *
 * - Festivals and their Yom Tov days, one in Israel and two in the
 *   diaspora (Shulchan Aruch, Orach Chayim 496); the span of Sukkot, Pesach
 *   and Hanukkah.
 * - The fasts and their postponements (Shulchan Aruch OC 549–550, 686:2,
 *   470:2): the fasts of Gedaliah, 17 Tammuz and 9 Av move from Shabbat to
 *   Sunday; the fasts of Esther and of the firstborn move back to Thursday.
 *   10 Tevet is never moved.
 * - The State's days and their weekday rules (Israeli law, as summarised at
 *   https://en.wikipedia.org/wiki/Yom_Ha%27atzmaut and
 *   https://en.wikipedia.org/wiki/Yom_HaShoah): Yom HaShoah off Friday and
 *   Sunday; Yom HaZikaron and Yom HaAtzma'ut off Friday, Shabbat and (since
 *   2004) Monday; Sigd off Shabbat.
 *
 * Checked against the published Hebcal calendars (https://www.hebcal.com,
 * CC BY 4.0) in hebrew-calendar.test.ts.
 */

import type { HebrewMonthId } from './hebrew-months'

/** How the day is kept: a festival day of rest, a fast, a festival without the rest of Yom Tov, a lesser day, or a day of the State of Israel. */
export type HebrewDayKind = 'yomtov' | 'fast' | 'major' | 'minor' | 'modern'

/** Where a reckoning is kept: the Land of Israel, or outside it. */
export type HebrewReckoning = 'israel' | 'diaspora'

/** The weekday a day may not fall on (0 Sunday … 6 Shabbat) and the days it moves by when it would, from the year a law set it. */
export interface Postponement {
  readonly on: number
  readonly by: number
  readonly since?: number
}

export interface HebrewHoliday {
  readonly id: string
  readonly name: string
  readonly hebrewName: string
  /** Its month; `adar` is Adar II in a leap year. */
  readonly month: HebrewMonthId
  /** Its first day in the month. */
  readonly day: number
  readonly note: string
  readonly kind: HebrewDayKind
  /** The days it runs in Israel and in the diaspora, where more than one. */
  readonly span?: Readonly<Record<HebrewReckoning, number>>
  /** Its Yom Tov days by their place in the span (1 its first), where the span holds days of rest and days between. */
  readonly restDays?: Readonly<Record<HebrewReckoning, readonly number[]>>
  /** A day of the span with its own name (Sukkot's seventh, Hoshana Rabba), in English and Hebrew. */
  readonly named?: Readonly<Record<number, { readonly name: string; readonly hebrew: string }>>
  /** Kept in one reckoning only. */
  readonly only?: HebrewReckoning
  /** Its name in Israel, where Israel keeps two days as one. */
  readonly israelName?: string
  /** In a leap year only. */
  readonly leapOnly?: true
  /** It begins at the sundown before with its eve (Erev) named. */
  readonly erev?: true
  /** A day of fasting besides its kind. */
  readonly fast?: true
  readonly moves?: readonly Postponement[]
  /** The year it was first kept (a day the State set). */
  readonly since?: number
}

const SUNDAY = 0
const MONDAY = 1
const THURSDAY = 4
const FRIDAY = 5
const SHABBAT = 6

/** Shabbat to Sunday: the fasts of Gedaliah, 17 Tammuz and 9 Av (Shulchan Aruch OC 549:1–2, 550:3). */
const SHABBAT_TO_SUNDAY: readonly Postponement[] = [{ on: SHABBAT, by: 1 }]
/** Shabbat back to Thursday: the fasts of Esther and of the firstborn (Shulchan Aruch OC 686:2, 470:2). */
const SHABBAT_TO_THURSDAY: readonly Postponement[] = [{ on: SHABBAT, by: -2 }]
/** The Knesset's 2004 amendment moved the days of remembrance and independence off a Monday too. */
const MONDAY_RULE_SINCE = 5764

export const HEBREW_HOLIDAYS: readonly HebrewHoliday[] = Object.freeze([
  {
    id: 'rosh-hashanah', name: 'Rosh Hashanah', hebrewName: 'ראש השנה', month: 'tishrei', day: 1, kind: 'yomtov',
    span: { israel: 2, diaspora: 2 }, restDays: { israel: [1, 2], diaspora: [1, 2] }, erev: true,
    note: 'New year: the world is judged and the shofar sounds',
  },
  { id: 'tzom-gedaliah', name: 'Tzom Gedaliah', hebrewName: 'צום גדליה', month: 'tishrei', day: 3, kind: 'fast', moves: SHABBAT_TO_SUNDAY, note: 'The fast for Gedaliah, the last governor of Judah, dawn to nightfall' },
  { id: 'yom-kippur', name: 'Yom Kippur', hebrewName: 'יום כיפור', month: 'tishrei', day: 10, kind: 'yomtov', fast: true, erev: true, note: 'Day of Atonement: the fast of fasts' },
  {
    id: 'sukkot', name: 'Sukkot', hebrewName: 'סוכות', month: 'tishrei', day: 15, kind: 'yomtov',
    span: { israel: 7, diaspora: 7 }, restDays: { israel: [1], diaspora: [1, 2] }, named: { 7: { name: 'Hoshana Rabba', hebrew: 'הושענא רבה' } }, erev: true,
    note: 'Seven days in the booth, under the stars',
  },
  {
    id: 'shemini-atzeret', name: 'Shemini Atzeret', hebrewName: 'שמיני עצרת', israelName: 'Shemini Atzeret · Simchat Torah', month: 'tishrei', day: 22, kind: 'yomtov',
    note: 'The eighth day of assembly; in Israel the Torah cycle ends and begins again on it',
  },
  { id: 'simchat-torah', name: 'Simchat Torah', hebrewName: 'שמחת תורה', month: 'tishrei', day: 23, kind: 'yomtov', only: 'diaspora', note: 'The Torah cycle ends and begins again, dancing' },
  { id: 'hanukkah', name: 'Hanukkah', hebrewName: 'חנוכה', month: 'kislev', day: 25, kind: 'major', span: { israel: 8, diaspora: 8 }, erev: true, note: 'Eight nights of light: the rededication of the Temple' },
  { id: 'asara-btevet', name: 'Asara B’Tevet', hebrewName: 'עשרה בטבת', month: 'tevet', day: 10, kind: 'fast', note: 'The siege of Jerusalem began; dawn to nightfall' },
  { id: 'tu-bishvat', name: 'Tu BiShvat', hebrewName: 'ט״ו בשבט', month: 'shevat', day: 15, kind: 'minor', note: 'New year of the trees' },
  { id: 'purim-katan', name: 'Purim Katan', hebrewName: 'פורים קטן', month: 'adar1', day: 14, kind: 'minor', leapOnly: true, note: 'The little Purim of a leap year’s first Adar' },
  { id: 'taanit-esther', name: 'Ta’anit Esther', hebrewName: 'תענית אסתר', month: 'adar', day: 13, kind: 'fast', moves: SHABBAT_TO_THURSDAY, note: 'Esther’s fast before Purim, dawn to nightfall' },
  { id: 'purim', name: 'Purim', hebrewName: 'פורים', month: 'adar', day: 14, kind: 'major', erev: true, note: 'The scroll of Esther: hidden faces, reversed fates' },
  { id: 'shushan-purim', name: 'Shushan Purim', hebrewName: 'שושן פורים', month: 'adar', day: 15, kind: 'minor', note: 'Purim in walled cities, Jerusalem first among them' },
  { id: 'taanit-bechorot', name: 'Ta’anit Bechorot', hebrewName: 'תענית בכורות', month: 'nisan', day: 14, kind: 'fast', moves: SHABBAT_TO_THURSDAY, note: 'The firstborn’s fast on the eve of Pesach' },
  {
    id: 'pesach', name: 'Pesach', hebrewName: 'פסח', month: 'nisan', day: 15, kind: 'yomtov',
    span: { israel: 7, diaspora: 8 }, restDays: { israel: [1, 7], diaspora: [1, 2, 7, 8] }, erev: true,
    note: 'Passover: seven days of matzah, out of the narrow place',
  },
  { id: 'yom-haaliyah', name: 'Yom HaAliyah', hebrewName: 'יום העלייה', month: 'nisan', day: 10, kind: 'modern', since: 5777, note: 'The day of going up to the Land, as Joshua crossed the Jordan' },
  {
    id: 'yom-hashoah', name: 'Yom HaShoah', hebrewName: 'יום השואה', month: 'nisan', day: 27, kind: 'modern', since: 5711,
    moves: [{ on: FRIDAY, by: -1 }, { on: SUNDAY, by: 1 }], note: 'Holocaust and Heroism Remembrance Day',
  },
  {
    id: 'yom-hazikaron', name: 'Yom HaZikaron', hebrewName: 'יום הזיכרון', month: 'iyar', day: 4, kind: 'modern', since: 5711,
    moves: [{ on: THURSDAY, by: -1 }, { on: FRIDAY, by: -2 }, { on: SUNDAY, by: 1, since: MONDAY_RULE_SINCE }], note: 'Remembrance Day for the fallen and the victims of terror',
  },
  {
    id: 'yom-haatzmaut', name: 'Yom HaAtzma’ut', hebrewName: 'יום העצמאות', month: 'iyar', day: 5, kind: 'modern', since: 5708,
    moves: [{ on: FRIDAY, by: -1 }, { on: SHABBAT, by: -2 }, { on: MONDAY, by: 1, since: MONDAY_RULE_SINCE }], note: 'Independence Day',
  },
  { id: 'pesach-sheni', name: 'Pesach Sheni', hebrewName: 'פסח שני', month: 'iyar', day: 14, kind: 'minor', note: 'The second Pesach, for those who missed the first' },
  { id: 'lag-baomer', name: 'Lag BaOmer', hebrewName: 'ל״ג בעומר', month: 'iyar', day: 18, kind: 'minor', note: 'Bonfires on the 33rd day of the Omer' },
  { id: 'yom-yerushalayim', name: 'Yom Yerushalayim', hebrewName: 'יום ירושלים', month: 'iyar', day: 28, kind: 'modern', since: 5728, note: 'Jerusalem Day: the city reunited in 1967' },
  {
    id: 'shavuot', name: 'Shavuot', hebrewName: 'שבועות', month: 'sivan', day: 6, kind: 'yomtov',
    span: { israel: 1, diaspora: 2 }, restDays: { israel: [1], diaspora: [1, 2] }, erev: true,
    note: 'The giving of the Torah, fifty days after Pesach',
  },
  { id: 'tzom-tammuz', name: 'Tzom Tammuz', hebrewName: 'צום י״ז בתמוז', month: 'tammuz', day: 17, kind: 'fast', moves: SHABBAT_TO_SUNDAY, note: 'The walls of Jerusalem breached; the Three Weeks begin' },
  { id: 'tisha-bav', name: 'Tisha B’Av', hebrewName: 'תשעה באב', month: 'av', day: 9, kind: 'fast', moves: SHABBAT_TO_SUNDAY, erev: true, note: 'The fast for both Temples, and every exile since' },
  { id: 'tu-bav', name: 'Tu B’Av', hebrewName: 'ט״ו באב', month: 'av', day: 15, kind: 'minor', note: 'The day of love, when the vineyards were danced in' },
  { id: 'sigd', name: 'Sigd', hebrewName: 'סיגד', month: 'cheshvan', day: 29, kind: 'modern', since: 5769, moves: [{ on: SHABBAT, by: -2 }], note: 'The Ethiopian Jews’ day of renewing the covenant, fifty days after Yom Kippur' },
] satisfies readonly HebrewHoliday[])

/** A stretch of the year the tradition names: the Days of Awe, the Omer, the Three Weeks. */
export interface HebrewSeason {
  readonly id: 'yamim-noraim' | 'omer' | 'three-weeks'
  readonly name: string
  readonly hebrewName: string
  readonly from: readonly [HebrewMonthId, number]
  readonly to: readonly [HebrewMonthId, number]
  readonly note: string
}

/**
 * The named stretches: the Days of Awe from Rosh Hashanah to Yom Kippur;
 * the Omer's forty-nine days from the second day of Pesach (Leviticus
 * 23:15–16); and Bein HaMetzarim, the Three Weeks from 17 Tammuz to 9 Av
 * (Lamentations 1:3; Shulchan Aruch OC 551).
 */
export const HEBREW_SEASONS: readonly HebrewSeason[] = Object.freeze([
  { id: 'yamim-noraim', name: 'Yamim Noraim', hebrewName: 'ימים נוראים', from: ['tishrei', 1], to: ['tishrei', 10], note: 'The Days of Awe, Rosh Hashanah to Yom Kippur' },
  { id: 'omer', name: 'The Omer', hebrewName: 'ספירת העומר', from: ['nisan', 16], to: ['sivan', 5], note: 'Forty-nine days counted from Pesach to Shavuot' },
  { id: 'three-weeks', name: 'The Three Weeks', hebrewName: 'בין המצרים', from: ['tammuz', 17], to: ['av', 9], note: 'Between the straits: from the walls breached to the Temple’s fall' },
] satisfies readonly HebrewSeason[])
