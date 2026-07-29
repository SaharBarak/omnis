/**
 * Hebrew calendar — structured date parts and holiday proximity, on the same
 * zero-dependency Intl foundation as calendars.ts (null-degrading where the
 * runtime lacks calendar data).
 *
 * Holidays are matched by (Hebrew month, day) while scanning forward through
 * civil days, so leap-month drift is handled by Intl itself. Multi-day
 * festivals are anchored to their first day.
 */

export interface HebrewDateParts {
  readonly day: number
  /** Intl's en month name: Tishri, Heshvan, … , Adar, Adar I, Adar II. */
  readonly month: string
  readonly year: number
  /** e.g. "10 Av 5786". */
  readonly formatted: string
}

export function hebrewDateParts(date: Date): HebrewDateParts | null {
  try {
    const parts = new Intl.DateTimeFormat('en-GB-u-ca-hebrew', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).formatToParts(date)
    const get = (type: string) => parts.find((p) => p.type === type)?.value
    const day = Number(get('day'))
    const month = get('month')
    const year = Number(get('year'))
    if (!month || !Number.isFinite(day) || !Number.isFinite(year)) return null
    return { day, month, year, formatted: `${day} ${month} ${year}` }
  } catch {
    return null
  }
}

export interface HebrewHoliday {
  readonly name: string
  readonly hebrewName: string
  /** Anchor day — first day for multi-day festivals. */
  readonly month: string | readonly string[]
  readonly day: number
  readonly note: string
}

export const HEBREW_HOLIDAYS: readonly HebrewHoliday[] = Object.freeze([
  { name: 'Rosh Hashanah', hebrewName: 'ראש השנה', month: 'Tishri', day: 1, note: 'New year — the world is judged and the shofar sounds' },
  { name: 'Yom Kippur', hebrewName: 'יום כיפור', month: 'Tishri', day: 10, note: 'Day of Atonement — the fast of fasts' },
  { name: 'Sukkot', hebrewName: 'סוכות', month: 'Tishri', day: 15, note: 'Seven days in the booth, under the stars' },
  { name: 'Simchat Torah', hebrewName: 'שמחת תורה', month: 'Tishri', day: 22, note: 'The Torah cycle ends and begins again, dancing' },
  { name: 'Hanukkah', hebrewName: 'חנוכה', month: 'Kislev', day: 25, note: 'Eight nights of light — the rededication of the Temple' },
  { name: 'Tu BiShvat', hebrewName: 'ט״ו בשבט', month: 'Shevat', day: 15, note: 'New year of the trees' },
  { name: 'Purim', hebrewName: 'פורים', month: ['Adar', 'Adar II'], day: 14, note: 'The scroll of Esther — hidden faces, reversed fates' },
  { name: 'Passover', hebrewName: 'פסח', month: 'Nisan', day: 15, note: 'Seven days of matzah — out of the narrow place' },
  { name: 'Lag BaOmer', hebrewName: 'ל״ג בעומר', month: 'Iyar', day: 18, note: 'Bonfires on the 33rd day of the Omer count' },
  { name: 'Shavuot', hebrewName: 'שבועות', month: 'Sivan', day: 6, note: 'The giving of the Torah, fifty days after Passover' },
  { name: 'Tisha B’Av', hebrewName: 'תשעה באב', month: 'Av', day: 9, note: 'The fast for both Temples, and every exile since' },
])

export interface UpcomingHoliday {
  readonly holiday: HebrewHoliday
  /** Civil date (YYYY-MM-DD, UTC) of the holiday's anchor day. */
  readonly date: string
  readonly hebrewDate: string
  /** Whole days from `from` (0 = today). */
  readonly inDays: number
}

function matchesMonth(holiday: HebrewHoliday, month: string): boolean {
  return Array.isArray(holiday.month)
    ? holiday.month.includes(month)
    : holiday.month === month
}

/**
 * The next `count` holidays on/after `from`, found by scanning civil days
 * forward (≤ 400 — always covers a full Hebrew year, leap or not).
 */
export function upcomingHebrewHolidays(from: Date, count = 4): UpcomingHoliday[] {
  const found: UpcomingHoliday[] = []
  const start = Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate())
  for (let i = 0; i <= 400 && found.length < count; i++) {
    const d = new Date(start + i * 86_400_000)
    const parts = hebrewDateParts(d)
    if (!parts) return found
    for (const holiday of HEBREW_HOLIDAYS) {
      if (holiday.day === parts.day && matchesMonth(holiday, parts.month)) {
        found.push({
          holiday,
          date: d.toISOString().split('T')[0],
          hebrewDate: parts.formatted,
          inDays: i,
        })
      }
    }
  }
  return found
}
