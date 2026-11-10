/**
 * The Hijri year's months, days and named stretches, each by its month's
 * number (1 Muharram … 12 Dhu al-Hijjah), never by a runtime's spelling of
 * the month's name.
 *
 * - Months, their Arabic names and the meanings of the names: the months
 *   table at https://en.wikipedia.org/wiki/Islamic_calendar . The four sacred
 *   months, in which fighting is forbidden: Qur'an 9:36 ("of them four are
 *   sacred"), named in the Farewell Sermon (Sahih al-Bukhari 4662) as Dhu
 *   al-Qa'dah, Dhu al-Hijjah, Muharram and Rajab.
 * - Days: the notable dates listed there; a night (laylah) belongs to the
 *   day after it, the Islamic day beginning at sunset, so a night is kept
 *   from the sundown that ends the day before.
 * - The white days, the 13th to 15th of every month, fasted by the Sunna
 *   (Sunan an-Nasa'i 2422, Abu Dharr); the last ten nights of Ramadan; the
 *   first ten days of Dhu al-Hijjah and the three days of Tashriq after the
 *   Eid (Qur'an 2:203).
 *
 * The months of Ramadan, Shawwal and Dhu al-Hijjah are begun by sighting
 * the crescent: the dates the engine gives are Umm al-Qura's reckoning,
 * which a sighting may move by a day.
 */

export interface HijriMonth {
  readonly number: number
  readonly name: string
  readonly arabic: string
  /** Intl's en name for it, the runtime's spelling (Rabiʻ I, Dhuʻl-Hijjah). */
  readonly intl: string
  /** What the name means. */
  readonly meaning: string
  readonly sacred: boolean
}

export const HIJRI_MONTHS: readonly HijriMonth[] = Object.freeze([
  { number: 1, name: 'Muharram', arabic: 'محرم', intl: 'Muharram', meaning: 'forbidden', sacred: true },
  { number: 2, name: 'Safar', arabic: 'صفر', intl: 'Safar', meaning: 'void', sacred: false },
  { number: 3, name: 'Rabi al-Awwal', arabic: 'ربيع الأول', intl: 'Rabiʻ I', meaning: 'the first spring', sacred: false },
  { number: 4, name: 'Rabi al-Akhir', arabic: 'ربيع الآخر', intl: 'Rabiʻ II', meaning: 'the last spring', sacred: false },
  { number: 5, name: 'Jumada al-Ula', arabic: 'جمادى الأولى', intl: 'Jumada I', meaning: 'the first of parched land', sacred: false },
  { number: 6, name: 'Jumada al-Akhirah', arabic: 'جمادى الآخرة', intl: 'Jumada II', meaning: 'the last of parched land', sacred: false },
  { number: 7, name: 'Rajab', arabic: 'رجب', intl: 'Rajab', meaning: 'respect, honour', sacred: true },
  { number: 8, name: 'Shaban', arabic: 'شعبان', intl: 'Shaʻban', meaning: 'scattered', sacred: false },
  { number: 9, name: 'Ramadan', arabic: 'رمضان', intl: 'Ramadan', meaning: 'burning heat', sacred: false },
  { number: 10, name: 'Shawwal', arabic: 'شوال', intl: 'Shawwal', meaning: 'raised', sacred: false },
  { number: 11, name: 'Dhu al-Qadah', arabic: 'ذو القعدة', intl: 'Dhuʻl-Qiʻdah', meaning: 'the one of truce, of sitting', sacred: true },
  { number: 12, name: 'Dhu al-Hijjah', arabic: 'ذو الحجة', intl: 'Dhuʻl-Hijjah', meaning: 'the one of pilgrimage', sacred: true },
])

/** How a day is kept: a festival (Eid), a day, or a night kept from the sundown before its day. */
export type HijriDayKind = 'eid' | 'day' | 'night'

export interface HijriDay {
  readonly id: string
  readonly name: string
  readonly arabic: string
  readonly month: number
  readonly day: number
  readonly kind: HijriDayKind
  readonly note: string
  /** In a month whose first day is set by sighting the crescent. */
  readonly sighted?: true
}

export const HIJRI_DAYS: readonly HijriDay[] = Object.freeze([
  { id: 'new-year', name: 'Islamic New Year', arabic: 'رأس السنة الهجرية', month: 1, day: 1, kind: 'day', note: 'The year count begins from the Hijra, the migration to Medina' },
  { id: 'ashura', name: 'Ashura', arabic: 'عاشوراء', month: 1, day: 10, kind: 'day', note: 'A day of fasting; for Shia Islam, the mourning of Karbala' },
  { id: 'mawlid', name: 'Mawlid', arabic: 'المولد النبوي', month: 3, day: 12, kind: 'day', note: 'The birthday of the Prophet: the 12th for Sunnis, the 17th for Shia' },
  { id: 'isra-miraj', name: 'Laylat al-Miʻraj', arabic: 'الإسراء والمعراج', month: 7, day: 27, kind: 'night', note: 'The Night Journey and Ascension' },
  { id: 'mid-shaban', name: 'Mid-Shaban', arabic: 'ليلة النصف من شعبان', month: 8, day: 15, kind: 'night', note: 'The night of forgiveness, midway through Shaban' },
  { id: 'ramadan', name: 'Ramadan begins', arabic: 'رمضان', month: 9, day: 1, kind: 'day', sighted: true, note: 'The month of fasting, dawn to sunset' },
  { id: 'qadr', name: 'Laylat al-Qadr', arabic: 'ليلة القدر', month: 9, day: 27, kind: 'night', sighted: true, note: 'The Night of Power, sought in the odd nights of the last ten; kept on the 27th' },
  { id: 'eid-al-fitr', name: 'Eid al-Fitr', arabic: 'عيد الفطر', month: 10, day: 1, kind: 'eid', sighted: true, note: 'The festival of breaking the fast' },
  { id: 'arafah', name: 'Day of Arafah', arabic: 'يوم عرفة', month: 12, day: 9, kind: 'day', sighted: true, note: 'The pilgrims stand at Mount Arafah' },
  { id: 'eid-al-adha', name: 'Eid al-Adha', arabic: 'عيد الأضحى', month: 12, day: 10, kind: 'eid', sighted: true, note: 'The festival of sacrifice, at the height of the Hajj' },
] satisfies readonly HijriDay[])

/** A named stretch of days: in one month, or (`month` 0) in every month. */
export interface HijriSpan {
  readonly id: 'white-days' | 'last-ten' | 'first-ten' | 'tashriq'
  readonly name: string
  readonly arabic: string
  readonly month: number
  readonly from: number
  readonly to: number
  readonly note: string
}

export const HIJRI_SPANS: readonly HijriSpan[] = Object.freeze([
  { id: 'white-days', name: 'White days', arabic: 'الأيام البيض', month: 0, from: 13, to: 15, note: 'The three days of the full moon, fasted by the Sunna' },
  { id: 'last-ten', name: 'Last ten nights', arabic: 'العشر الأواخر', month: 9, from: 21, to: 30, note: 'Laylat al-Qadr is sought in their odd nights' },
  { id: 'first-ten', name: 'First ten days', arabic: 'عشر ذي الحجة', month: 12, from: 1, to: 10, note: 'The ten days of the Hajj season, ending with the Eid' },
  { id: 'tashriq', name: 'Days of Tashriq', arabic: 'أيام التشريق', month: 12, from: 11, to: 13, note: 'The three days after the Eid, kept at Mina' },
] satisfies readonly HijriSpan[])
