/**
 * Hijri, Persian, and Chinese calendars — structured date parts and holiday
 * proximity, mirroring hebrew-calendar.ts on the same zero-dependency Intl
 * foundation (null-degrading where the runtime lacks calendar data).
 *
 * Holidays are matched by (month name, day) while scanning forward through
 * civil days, so epact and leap-month drift are handled by Intl itself.
 * Chinese leap months surface from Intl as e.g. "Sixth Monthbis" and never
 * match the festival tables — festivals belong to the regular month.
 */

export interface WorldDateParts {
  readonly day: number
  /** Intl's en month name: Safar / Mordad / "Sixth Month" … */
  readonly month: string
  readonly year: number
  /** e.g. "15 Safar 1448 AH". */
  readonly formatted: string
}

function intlDateParts(
  date: Date,
  calendar: string,
  era: boolean
): WorldDateParts | null {
  try {
    const parts = new Intl.DateTimeFormat(`en-GB-u-ca-${calendar}`, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).formatToParts(date)
    const get = (type: string) => parts.find((p) => p.type === type)?.value
    const day = Number(get('day'))
    const month = get('month')
    const year = Number(get('year') ?? get('relatedYear'))
    if (!month || !Number.isFinite(day) || !Number.isFinite(year)) return null
    const suffix = era ? ` ${get('era') ?? ''}`.trimEnd() : ''
    return { day, month, year, formatted: `${day} ${month} ${year}${suffix}` }
  } catch {
    return null
  }
}

/** e.g. { day: 15, month: "Safar", year: 1448, formatted: "15 Safar 1448 AH" } */
export function hijriDateParts(date: Date): WorldDateParts | null {
  return intlDateParts(date, 'islamic-umalqura', true)
}

/** e.g. { day: 7, month: "Mordad", year: 1405, formatted: "7 Mordad 1405 AP" } */
export function persianDateParts(date: Date): WorldDateParts | null {
  return intlDateParts(date, 'persian', true)
}

/**
 * Chinese lunisolar date; `year` is Intl's relatedYear (the Gregorian year
 * the Chinese year began in), e.g. "16 Sixth Month 2026".
 */
export function chineseDateParts(date: Date): WorldDateParts | null {
  return intlDateParts(date, 'chinese', false)
}

export interface WorldHoliday {
  readonly name: string
  /** Native-script or romanized native name. */
  readonly nativeName: string
  /** Intl en month name(s) this holiday anchors to. */
  readonly month: string | readonly string[]
  readonly day: number
  readonly note: string
}

export const HIJRI_HOLIDAYS: readonly WorldHoliday[] = Object.freeze([
  { name: 'Islamic New Year', nativeName: 'رأس السنة الهجرية', month: 'Muharram', day: 1, note: 'The year count begins from the Hijra — the migration to Medina' },
  { name: 'Ashura', nativeName: 'عاشوراء', month: 'Muharram', day: 10, note: 'A day of fasting; for Shia Islam, the mourning of Karbala' },
  { name: 'Mawlid', nativeName: 'المولد النبوي', month: 'Rabiʻ I', day: 12, note: 'The birthday of the Prophet Muhammad' },
  { name: 'Laylat al-Miʻraj', nativeName: 'ليلة المعراج', month: 'Rajab', day: 27, note: 'The Night Journey and Ascension' },
  { name: 'Ramadan begins', nativeName: 'رمضان', month: 'Ramadan', day: 1, note: 'The month of fasting, dawn to sunset' },
  { name: 'Laylat al-Qadr', nativeName: 'ليلة القدر', month: 'Ramadan', day: 27, note: 'The Night of Power — traditionally observed on the 27th' },
  { name: 'Eid al-Fitr', nativeName: 'عيد الفطر', month: 'Shawwal', day: 1, note: 'The festival of breaking the fast' },
  { name: 'Day of Arafah', nativeName: 'يوم عرفة', month: 'Dhuʻl-Hijjah', day: 9, note: 'The pilgrims stand at Mount Arafah' },
  { name: 'Eid al-Adha', nativeName: 'عيد الأضحى', month: 'Dhuʻl-Hijjah', day: 10, note: 'The festival of sacrifice, at the height of the Hajj' },
])

export const PERSIAN_HOLIDAYS: readonly WorldHoliday[] = Object.freeze([
  { name: 'Nowruz', nativeName: 'نوروز', month: 'Farvardin', day: 1, note: 'New year at the spring equinox — the table of seven S’s' },
  { name: 'Sizdah Bedar', nativeName: 'سیزده‌به‌در', month: 'Farvardin', day: 13, note: 'Nature day — the thirteenth spent outdoors' },
  { name: 'Tirgan', nativeName: 'تیرگان', month: 'Tir', day: 13, note: 'Midsummer water festival honoring Tishtrya' },
  { name: 'Mehregan', nativeName: 'مهرگان', month: 'Mehr', day: 16, note: 'Autumn festival of Mithra — friendship and harvest' },
  { name: 'Yalda', nativeName: 'شب یلدا', month: 'Azar', day: 30, note: 'The longest night — pomegranates, poetry, and staying up late' },
  { name: 'Sadeh', nativeName: 'سده', month: 'Bahman', day: 10, note: 'Midwinter fire festival, fifty days before Nowruz' },
])

export const CHINESE_FESTIVALS: readonly WorldHoliday[] = Object.freeze([
  { name: 'Chinese New Year', nativeName: '春节', month: 'First Month', day: 1, note: 'The Spring Festival — the lunisolar year turns' },
  { name: 'Lantern Festival', nativeName: '元宵节', month: 'First Month', day: 15, note: 'First full moon of the year — lanterns and riddles' },
  { name: 'Dragon Boat Festival', nativeName: '端午节', month: 'Fifth Month', day: 5, note: 'Races and zongzi for the poet Qu Yuan' },
  { name: 'Qixi', nativeName: '七夕', month: 'Seventh Month', day: 7, note: 'The Weaver Girl and the Cowherd cross the magpie bridge' },
  { name: 'Ghost Festival', nativeName: '中元节', month: 'Seventh Month', day: 15, note: 'The gates open — offerings for the ancestors' },
  { name: 'Mid-Autumn Festival', nativeName: '中秋节', month: 'Eighth Month', day: 15, note: 'The harvest moon — mooncakes and reunion' },
  { name: 'Double Ninth', nativeName: '重阳节', month: 'Ninth Month', day: 9, note: 'Climbing heights; honoring elders' },
  { name: 'Laba Festival', nativeName: '腊八节', month: 'Twelfth Month', day: 8, note: 'Laba congee — the year’s last stretch begins' },
])

export interface UpcomingWorldHoliday {
  readonly holiday: WorldHoliday
  /** Civil date (YYYY-MM-DD, UTC) of the holiday's anchor day. */
  readonly date: string
  /** The date formatted in its own calendar. */
  readonly calendarDate: string
  /** Whole days from `from` (0 = today). */
  readonly inDays: number
}

function matchesMonth(holiday: WorldHoliday, month: string): boolean {
  return Array.isArray(holiday.month)
    ? holiday.month.includes(month)
    : holiday.month === month
}

/**
 * The next `count` holidays on/after `from`, by scanning civil days forward
 * (≤ 400 — covers a full year of every supported calendar, leap or not).
 */
function upcomingHolidays(
  from: Date,
  count: number,
  holidays: readonly WorldHoliday[],
  partsOf: (d: Date) => WorldDateParts | null
): UpcomingWorldHoliday[] {
  const found: UpcomingWorldHoliday[] = []
  const start = Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate())
  for (let i = 0; i <= 400 && found.length < count; i++) {
    const d = new Date(start + i * 86_400_000)
    const parts = partsOf(d)
    if (!parts) return found
    for (const holiday of holidays) {
      if (holiday.day === parts.day && matchesMonth(holiday, parts.month)) {
        found.push({
          holiday,
          date: d.toISOString().split('T')[0],
          calendarDate: parts.formatted,
          inDays: i,
        })
      }
    }
  }
  return found
}

export function upcomingHijriHolidays(from: Date, count = 4): UpcomingWorldHoliday[] {
  return upcomingHolidays(from, count, HIJRI_HOLIDAYS, hijriDateParts)
}

export function upcomingPersianHolidays(from: Date, count = 4): UpcomingWorldHoliday[] {
  return upcomingHolidays(from, count, PERSIAN_HOLIDAYS, persianDateParts)
}

export function upcomingChineseFestivals(from: Date, count = 4): UpcomingWorldHoliday[] {
  return upcomingHolidays(from, count, CHINESE_FESTIVALS, chineseDateParts)
}
