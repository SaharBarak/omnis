/**
 * The Persian (Solar Hijri) year's months and days as the Zoroastrian
 * calendar names them, and the year's feasts.
 *
 * - Day and month dedications: the thirty yazatas of the days and the
 *   twelve of the months (https://en.wikipedia.org/wiki/Zoroastrian_calendar ,
 *   after Boyce, A History of Zoroastrianism 2:243–250; Encyclopaedia
 *   Iranica, "Calendars", https://www.iranicaonline.org/articles/calendars ),
 *   in their Middle Persian forms. Ahura Mazda holds four days, the 1st,
 *   8th, 15th and 23rd, which open the month's four weeks.
 * - The civil reading: Iran's Solar Hijri months keep the Zoroastrian
 *   names, and the Iranian Zoroastrians' Bastani reckoning follows the civil
 *   year; the engine reads the thirty day names onto the civil days 1 to 30
 *   of each month, the reading under which Mehregan falls on 16 Mehr and
 *   Tirgan on 13 Tir as Iran keeps them. The civil 31st of the first six
 *   months carries no day name here.
 * - A jashn (name-day feast) is the day whose yazata is the month's: one a
 *   month, four in Dey (its 1st, 8th, 15th and 23rd).
 * - Dari (Afghan) month names, after the signs:
 *   https://en.wikipedia.org/wiki/Solar_Hijri_calendar .
 * - Public holidays on fixed solar dates, printed red in Iran's official
 *   calendar with every Friday: https://en.wikipedia.org/wiki/Public_holidays_in_Iran .
 *   The holidays Iran dates by its own sighting of the lunar months are not
 *   here: the engine reckons the Hijri months by Umm al-Qura, which can
 *   differ from Iran's by a day.
 */

export interface ZoroastrianDay {
  readonly day: number
  readonly name: string
  readonly persian: string
  /** The yazata the day is dedicated to, in its Avestan form. */
  readonly yazata: string
  readonly gloss: string
}

export const ZOROASTRIAN_DAYS: readonly ZoroastrianDay[] = Object.freeze([
  { day: 1, name: 'Ohrmazd', persian: 'اورمزد', yazata: 'Ahura Mazda', gloss: 'the Wise Lord' },
  { day: 2, name: 'Bahman', persian: 'بهمن', yazata: 'Vohu Manah', gloss: 'good mind' },
  { day: 3, name: 'Ordibehesht', persian: 'اردیبهشت', yazata: 'Asha Vahishta', gloss: 'best truth' },
  { day: 4, name: 'Shahrivar', persian: 'شهریور', yazata: 'Khshathra Vairya', gloss: 'desirable dominion' },
  { day: 5, name: 'Sepandarmaz', persian: 'سپندارمذ', yazata: 'Spenta Armaiti', gloss: 'holy devotion' },
  { day: 6, name: 'Khordad', persian: 'خرداد', yazata: 'Haurvatat', gloss: 'wholeness' },
  { day: 7, name: 'Amordad', persian: 'امرداد', yazata: 'Ameretat', gloss: 'immortality' },
  { day: 8, name: 'Dey-be-Azar', persian: 'دی به آذر', yazata: 'Ahura Mazda', gloss: 'the Creator, before Azar' },
  { day: 9, name: 'Azar', persian: 'آذر', yazata: 'Atar', gloss: 'fire' },
  { day: 10, name: 'Aban', persian: 'آبان', yazata: 'Apas', gloss: 'the waters' },
  { day: 11, name: 'Khorshid', persian: 'خورشید', yazata: 'Hvar', gloss: 'the sun' },
  { day: 12, name: 'Mah', persian: 'ماه', yazata: 'Mah', gloss: 'the moon' },
  { day: 13, name: 'Tir', persian: 'تیر', yazata: 'Tishtrya', gloss: 'Sirius, the rain star' },
  { day: 14, name: 'Gosh', persian: 'گوش', yazata: 'Geush Urvan', gloss: 'the soul of the cattle' },
  { day: 15, name: 'Dey-be-Mehr', persian: 'دی به مهر', yazata: 'Ahura Mazda', gloss: 'the Creator, before Mehr' },
  { day: 16, name: 'Mehr', persian: 'مهر', yazata: 'Mithra', gloss: 'covenant' },
  { day: 17, name: 'Sorush', persian: 'سروش', yazata: 'Sraosha', gloss: 'hearkening' },
  { day: 18, name: 'Rashn', persian: 'رشن', yazata: 'Rashnu', gloss: 'justice' },
  { day: 19, name: 'Farvardin', persian: 'فروردین', yazata: 'Fravashi', gloss: 'the guardian spirits' },
  { day: 20, name: 'Bahram', persian: 'بهرام', yazata: 'Verethragna', gloss: 'victory' },
  { day: 21, name: 'Ram', persian: 'رام', yazata: 'Raman', gloss: 'peace' },
  { day: 22, name: 'Bad', persian: 'باد', yazata: 'Vata', gloss: 'the wind' },
  { day: 23, name: 'Dey-be-Din', persian: 'دی به دین', yazata: 'Ahura Mazda', gloss: 'the Creator, before Din' },
  { day: 24, name: 'Din', persian: 'دین', yazata: 'Daena', gloss: 'conscience' },
  { day: 25, name: 'Ard', persian: 'ارد', yazata: 'Ashi', gloss: 'reward' },
  { day: 26, name: 'Ashtad', persian: 'اشتاد', yazata: 'Arshtat', gloss: 'rectitude' },
  { day: 27, name: 'Asman', persian: 'آسمان', yazata: 'Asman', gloss: 'the sky' },
  { day: 28, name: 'Zamyad', persian: 'زامیاد', yazata: 'Zam', gloss: 'the earth' },
  { day: 29, name: 'Mahraspand', persian: 'مهراسپند', yazata: 'Manthra Spenta', gloss: 'the holy word' },
  { day: 30, name: 'Anaram', persian: 'انارام', yazata: 'Anaghra Raocha', gloss: 'endless light' },
])

export type PersianSeason = 'spring' | 'summer' | 'autumn' | 'winter'

/** The seasons by their Persian names, three months each from Farvardin. */
export const PERSIAN_SEASONS: Readonly<Record<PersianSeason, string>> = Object.freeze({ spring: 'بهار', summer: 'تابستان', autumn: 'پاییز', winter: 'زمستان' })

export interface PersianMonth {
  readonly number: number
  readonly name: string
  readonly persian: string
  /** Intl's en name for it. */
  readonly intl: string
  /** The yazata the month is dedicated to, as its day is. */
  readonly yazata: string
  readonly gloss: string
  /** Its name-day feast. */
  readonly jashn: string
  /** Its Dari name, after its sign, and the name in its script. */
  readonly dari: string
  readonly dariScript: string
  readonly season: PersianSeason
}

export const PERSIAN_MONTHS: readonly PersianMonth[] = Object.freeze([
  { number: 1, name: 'Farvardin', persian: 'فروردین', intl: 'Farvardin', yazata: 'Fravashi', gloss: 'the guardian spirits', jashn: 'Farvardinegan', dari: 'Hamal', dariScript: 'حمل', season: 'spring' },
  { number: 2, name: 'Ordibehesht', persian: 'اردیبهشت', intl: 'Ordibehesht', yazata: 'Asha Vahishta', gloss: 'best truth', jashn: 'Ordibeheshtgan', dari: 'Sawr', dariScript: 'ثور', season: 'spring' },
  { number: 3, name: 'Khordad', persian: 'خرداد', intl: 'Khordad', yazata: 'Haurvatat', gloss: 'wholeness', jashn: 'Khordadgan', dari: 'Jawza', dariScript: 'جوزا', season: 'spring' },
  { number: 4, name: 'Tir', persian: 'تیر', intl: 'Tir', yazata: 'Tishtrya', gloss: 'Sirius, the rain star', jashn: 'Tirgan', dari: 'Saratan', dariScript: 'سرطان', season: 'summer' },
  { number: 5, name: 'Mordad', persian: 'مرداد', intl: 'Mordad', yazata: 'Ameretat', gloss: 'immortality', jashn: 'Amordadgan', dari: 'Asad', dariScript: 'اسد', season: 'summer' },
  { number: 6, name: 'Shahrivar', persian: 'شهریور', intl: 'Shahrivar', yazata: 'Khshathra Vairya', gloss: 'desirable dominion', jashn: 'Shahrivargan', dari: 'Sunbula', dariScript: 'سنبله', season: 'summer' },
  { number: 7, name: 'Mehr', persian: 'مهر', intl: 'Mehr', yazata: 'Mithra', gloss: 'covenant', jashn: 'Mehregan', dari: 'Mizan', dariScript: 'میزان', season: 'autumn' },
  { number: 8, name: 'Aban', persian: 'آبان', intl: 'Aban', yazata: 'Apas', gloss: 'the waters', jashn: 'Abangan', dari: 'Aqrab', dariScript: 'عقرب', season: 'autumn' },
  { number: 9, name: 'Azar', persian: 'آذر', intl: 'Azar', yazata: 'Atar', gloss: 'fire', jashn: 'Azargan', dari: 'Qaws', dariScript: 'قوس', season: 'autumn' },
  { number: 10, name: 'Dey', persian: 'دی', intl: 'Dey', yazata: 'Ahura Mazda', gloss: 'the Creator', jashn: 'Deygan', dari: 'Jadi', dariScript: 'جدی', season: 'winter' },
  { number: 11, name: 'Bahman', persian: 'بهمن', intl: 'Bahman', yazata: 'Vohu Manah', gloss: 'good mind', jashn: 'Bahmangan', dari: 'Dalw', dariScript: 'دلو', season: 'winter' },
  { number: 12, name: 'Esfand', persian: 'اسفند', intl: 'Esfand', yazata: 'Spenta Armaiti', gloss: 'holy devotion', jashn: 'Sepandarmazgan', dari: 'Hut', dariScript: 'حوت', season: 'winter' },
])

/** How a feast is kept: a public holiday (a day off, printed red), a festival day, or an evening kept from sundown. */
export type PersianFeastKind = 'holiday' | 'festival' | 'evening'

export interface PersianFeast {
  readonly id: string
  readonly name: string
  readonly persian: string
  readonly month: number
  readonly day: number
  readonly kind: PersianFeastKind
  readonly note: string
  /** The days it runs, where more than one. */
  readonly span?: number
}

export const PERSIAN_FEASTS: readonly PersianFeast[] = Object.freeze([
  { id: 'nowruz', name: 'Nowruz', persian: 'نوروز', month: 1, day: 1, kind: 'holiday', span: 4, note: 'New year at the spring equinox: the table of seven S’s; four days off' },
  { id: 'islamic-republic-day', name: 'Islamic Republic Day', persian: 'روز جمهوری اسلامی', month: 1, day: 12, kind: 'holiday', note: 'The referendum of 1979' },
  { id: 'sizdah-bedar', name: 'Sizdah Bedar', persian: 'سیزده‌به‌در', month: 1, day: 13, kind: 'holiday', note: 'Nature day: the thirteenth spent outdoors' },
  { id: 'khordad-14', name: 'Death of Khomeini', persian: 'رحلت امام خمینی', month: 3, day: 14, kind: 'holiday', note: 'The anniversary of 1989' },
  { id: 'khordad-15', name: 'Revolt of 15 Khordad', persian: 'قیام ۱۵ خرداد', month: 3, day: 15, kind: 'holiday', note: 'The demonstrations of June 1963' },
  { id: 'yalda', name: 'Yalda', persian: 'شب یلدا', month: 9, day: 30, kind: 'evening', note: 'The longest night: pomegranates, poetry and staying up late' },
  { id: 'sadeh', name: 'Sadeh', persian: 'سده', month: 11, day: 10, kind: 'evening', note: 'Midwinter fire festival, fifty days and nights before Nowruz' },
  { id: 'revolution-day', name: 'Revolution Day', persian: 'پیروزی انقلاب اسلامی', month: 11, day: 22, kind: 'holiday', note: 'The anniversary of the 1979 revolution' },
  { id: 'oil-day', name: 'Oil Nationalization Day', persian: 'ملی شدن صنعت نفت', month: 12, day: 29, kind: 'holiday', note: 'The oil industry nationalized, 1951' },
] satisfies readonly PersianFeast[])

/** Chaharshanbe Suri: the evening before the year's last Wednesday, fires jumped for the new year (https://en.wikipedia.org/wiki/Chaharshanbe_Suri). */
export const CHAHARSHANBE_SURI = Object.freeze({ id: 'chaharshanbe-suri', name: 'Chaharshanbe Suri', persian: 'چهارشنبه‌سوری', note: 'Fires jumped on the eve of the year’s last Wednesday' })
