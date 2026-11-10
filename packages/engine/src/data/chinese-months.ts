/**
 * The Chinese calendar's months, days and festivals, each by the month's
 * number (1 the first month … 12 the twelfth), never by a runtime's spelling
 * of its name. Month names as written in the almanacs, 正月 the first, 冬月
 * the eleventh, 腊月 the twelfth, a leap month marked 闰 before the month it
 * repeats; days 初一 to 初十, 十一 to 二十, 廿一 to 三十, the month in three
 * decades (旬 xún) of ten days
 * (https://en.wikipedia.org/wiki/Chinese_calendar , "Months", "Days").
 * The traditional festivals by month and day as listed at
 * https://en.wikipedia.org/wiki/Traditional_Chinese_holidays ; a festival
 * belongs to the regular month, never its leap month.
 */

export interface ChineseMonthName {
  readonly number: number
  readonly characters: string
  /** Intl's en name for it, the runtime's spelling ("First Month"). */
  readonly intl: string
}

const MONTH_ROWS = [
  ['正月', 'First Month'],
  ['二月', 'Second Month'],
  ['三月', 'Third Month'],
  ['四月', 'Fourth Month'],
  ['五月', 'Fifth Month'],
  ['六月', 'Sixth Month'],
  ['七月', 'Seventh Month'],
  ['八月', 'Eighth Month'],
  ['九月', 'Ninth Month'],
  ['十月', 'Tenth Month'],
  ['冬月', 'Eleventh Month'],
  ['腊月', 'Twelfth Month'],
] as const

export const CHINESE_MONTHS: readonly ChineseMonthName[] = Object.freeze(MONTH_ROWS.map(([characters, intl], i) => Object.freeze({ number: i + 1, characters, intl })))

/** The mark of a leap month, set before the month it repeats: 闰六月. */
export const LEAP_MARK = '闰'

/** The days of a month as written, 初一 to 三十. */
export const CHINESE_DAYS: readonly string[] = Object.freeze([
  ...['一', '二', '三', '四', '五', '六', '七', '八', '九', '十'].map((d) => `初${d}`),
  ...['一', '二', '三', '四', '五', '六', '七', '八', '九'].map((d) => `十${d}`),
  '二十',
  ...['一', '二', '三', '四', '五', '六', '七', '八', '九'].map((d) => `廿${d}`),
  '三十',
])

/** Days in a decade of the month (旬). */
export const DAYS_IN_XUN = 10

/** The month's three decades, as written. */
export const XUN: readonly string[] = Object.freeze(['上旬', '中旬', '下旬'])

export interface ChineseFestival {
  readonly id: string
  readonly name: string
  readonly characters: string
  readonly month: number
  readonly day: number
  readonly note: string
}

export const CHINESE_FESTIVALS: readonly ChineseFestival[] = Object.freeze([
  { id: 'spring', name: 'Chinese New Year', characters: '春节', month: 1, day: 1, note: 'The Spring Festival — the lunisolar year turns' },
  { id: 'lantern', name: 'Lantern Festival', characters: '元宵节', month: 1, day: 15, note: 'First full moon of the year — lanterns and riddles' },
  { id: 'dragon-boat', name: 'Dragon Boat Festival', characters: '端午节', month: 5, day: 5, note: 'Races and zongzi for the poet Qu Yuan' },
  { id: 'qixi', name: 'Qixi', characters: '七夕', month: 7, day: 7, note: 'The Weaver Girl and the Cowherd cross the magpie bridge' },
  { id: 'ghost', name: 'Ghost Festival', characters: '中元节', month: 7, day: 15, note: 'The gates open — offerings for the ancestors' },
  { id: 'mid-autumn', name: 'Mid-Autumn Festival', characters: '中秋节', month: 8, day: 15, note: 'The harvest moon — mooncakes and reunion' },
  { id: 'double-ninth', name: 'Double Ninth', characters: '重阳节', month: 9, day: 9, note: 'Climbing heights; honoring elders' },
  { id: 'laba', name: 'Laba Festival', characters: '腊八节', month: 12, day: 8, note: 'Laba congee — the year’s last stretch begins' },
])
