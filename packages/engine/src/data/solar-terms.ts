/**
 * The twenty-four solar terms (二十四节气), from 立春 Lichun with the Sun at
 * 315°, one every fifteen degrees of its apparent longitude: the sectional
 * terms (节 jié) at 15° past a multiple of 30°, each opening a solar month
 * of the four pillars; the principal terms (中气 zhōngqì) at the multiples
 * of 30°, by which the lunar months are numbered and a month holding none is
 * the leap month. Names as written on the mainland and in pinyin, and in
 * English as the Hong Kong Observatory's Gregorian-Lunar conversion tables
 * give them (hko.gov.hk, "Gregorian-Lunar Calendar Conversion Table"); the
 * seasons as the four "commences" terms open them
 * (https://en.wikipedia.org/wiki/Solar_term).
 */

export type TermSeason = 'spring' | 'summer' | 'autumn' | 'winter'

export interface SolarTerm {
  /** 0 (Lichun) to 23 (Dahan). */
  readonly index: number
  readonly characters: string
  readonly pinyin: string
  /** As the Hong Kong Observatory names it. */
  readonly english: string
  /** The Sun's apparent longitude at which it begins, in degrees. */
  readonly longitude: number
  /** A principal term (zhongqi), at a multiple of 30°; else a sectional one (jie). */
  readonly principal: boolean
  readonly season: TermSeason
}

/** Where the terms begin: Lichun, the Sun at 315°. */
export const LICHUN_LONGITUDE = 315
/** Degrees between terms. */
export const TERM_DEGREES = 15

const ROWS = [
  ['立春', 'Lichun', 'Spring Commences'],
  ['雨水', 'Yushui', 'Spring Showers'],
  ['惊蛰', 'Jingzhe', 'Insects Waken'],
  ['春分', 'Chunfen', 'Vernal Equinox'],
  ['清明', 'Qingming', 'Bright & Clear'],
  ['谷雨', 'Guyu', 'Corn Rain'],
  ['立夏', 'Lixia', 'Summer Commences'],
  ['小满', 'Xiaoman', 'Corn Forms'],
  ['芒种', 'Mangzhong', 'Corn on Ear'],
  ['夏至', 'Xiazhi', 'Summer Solstice'],
  ['小暑', 'Xiaoshu', 'Moderate Heat'],
  ['大暑', 'Dashu', 'Great Heat'],
  ['立秋', 'Liqiu', 'Autumn Commences'],
  ['处暑', 'Chushu', 'End of Heat'],
  ['白露', 'Bailu', 'White Dew'],
  ['秋分', 'Qiufen', 'Autumnal Equinox'],
  ['寒露', 'Hanlu', 'Cold Dew'],
  ['霜降', 'Shuangjiang', 'Frost'],
  ['立冬', 'Lidong', 'Winter Commences'],
  ['小雪', 'Xiaoxue', 'Light Snow'],
  ['大雪', 'Daxue', 'Heavy Snow'],
  ['冬至', 'Dongzhi', 'Winter Solstice'],
  ['小寒', 'Xiaohan', 'Moderate Cold'],
  ['大寒', 'Dahan', 'Severe Cold'],
] as const

const SEASONS: readonly TermSeason[] = ['spring', 'summer', 'autumn', 'winter']
/** Terms in a season: from one "commences" term to the next. */
const IN_SEASON = ROWS.length / SEASONS.length

export const SOLAR_TERMS: readonly SolarTerm[] = Object.freeze(
  ROWS.map(([characters, pinyin, english], index) => {
    const longitude = (LICHUN_LONGITUDE + index * TERM_DEGREES) % 360
    const season = SEASONS[Math.floor(index / IN_SEASON)]
    if (!season) throw new RangeError(`No season for term ${index}`)
    return Object.freeze({ index, characters, pinyin, english, longitude, principal: longitude % (2 * TERM_DEGREES) === 0, season })
  }),
)

/** The term that begins at a longitude's last fifteen-degree mark: the term the Sun is in. */
export const termAt = (longitude: number): SolarTerm => {
  const index = Math.floor((((longitude - LICHUN_LONGITUDE) % 360) + 360) % 360 / TERM_DEGREES)
  const term = SOLAR_TERMS[index]
  if (!term) throw new RangeError(`No term at ${longitude}`)
  return term
}
