/**
 * Hebrew Letters Data
 *
 * Complete Hebrew alphabet (22 letters) with gematria values, final forms,
 * and AtBash cipher pairs for multiple calculation methods.
 */

import type { HebrewLetter, HebrewLetterId, AllHebrewLetterId, NotableNumber } from '../types/gematria'

// =============================================================================
// HEBREW LETTERS (22 base letters)
// =============================================================================

export const HEBREW_LETTERS: readonly HebrewLetter[] = Object.freeze([
  {
    id: 'aleph',
    number: 1,
    letter: 'א',
    name: 'Aleph',
    nameHebrew: 'אלף',
    standardValue: 1,
    ordinalValue: 1,
    smallValue: 1,
    atbashPair: 'tav',
    keywords: Object.freeze(['unity', 'beginning', 'spirit', 'breath']),
    keywordsHebrew: Object.freeze(['אחדות', 'התחלה', 'רוח', 'נשימה']),
  },
  {
    id: 'bet',
    number: 2,
    letter: 'ב',
    name: 'Bet',
    nameHebrew: 'בית',
    standardValue: 2,
    ordinalValue: 2,
    smallValue: 2,
    atbashPair: 'shin',
    keywords: Object.freeze(['house', 'dwelling', 'duality', 'blessing']),
    keywordsHebrew: Object.freeze(['בית', 'משכן', 'דואליות', 'ברכה']),
  },
  {
    id: 'gimel',
    number: 3,
    letter: 'ג',
    name: 'Gimel',
    nameHebrew: 'גימל',
    standardValue: 3,
    ordinalValue: 3,
    smallValue: 3,
    atbashPair: 'resh',
    keywords: Object.freeze(['camel', 'reward', 'giving', 'richness']),
    keywordsHebrew: Object.freeze(['גמל', 'גמול', 'נתינה', 'עושר']),
  },
  {
    id: 'dalet',
    number: 4,
    letter: 'ד',
    name: 'Dalet',
    nameHebrew: 'דלת',
    standardValue: 4,
    ordinalValue: 4,
    smallValue: 4,
    atbashPair: 'qof',
    keywords: Object.freeze(['door', 'portal', 'humility', 'poverty']),
    keywordsHebrew: Object.freeze(['דלת', 'שער', 'ענווה', 'דלות']),
  },
  {
    id: 'he',
    number: 5,
    letter: 'ה',
    name: 'He',
    nameHebrew: 'הא',
    standardValue: 5,
    ordinalValue: 5,
    smallValue: 5,
    atbashPair: 'tsadi',
    keywords: Object.freeze(['window', 'breath', 'revelation', 'divine']),
    keywordsHebrew: Object.freeze(['חלון', 'נשימה', 'גילוי', 'אלוהי']),
  },
  {
    id: 'vav',
    number: 6,
    letter: 'ו',
    name: 'Vav',
    nameHebrew: 'וו',
    standardValue: 6,
    ordinalValue: 6,
    smallValue: 6,
    atbashPair: 'pe',
    keywords: Object.freeze(['hook', 'connection', 'completion', 'binding']),
    keywordsHebrew: Object.freeze(['וו', 'חיבור', 'השלמה', 'קשירה']),
  },
  {
    id: 'zayin',
    number: 7,
    letter: 'ז',
    name: 'Zayin',
    nameHebrew: 'זין',
    standardValue: 7,
    ordinalValue: 7,
    smallValue: 7,
    atbashPair: 'ayin',
    keywords: Object.freeze(['weapon', 'crown', 'sabbath', 'sustenance']),
    keywordsHebrew: Object.freeze(['נשק', 'כתר', 'שבת', 'מזון']),
  },
  {
    id: 'chet',
    number: 8,
    letter: 'ח',
    name: 'Chet',
    nameHebrew: 'חית',
    standardValue: 8,
    ordinalValue: 8,
    smallValue: 8,
    atbashPair: 'samech',
    keywords: Object.freeze(['fence', 'life', 'transcendence', 'grace']),
    keywordsHebrew: Object.freeze(['גדר', 'חיים', 'התעלות', 'חן']),
  },
  {
    id: 'tet',
    number: 9,
    letter: 'ט',
    name: 'Tet',
    nameHebrew: 'טית',
    standardValue: 9,
    ordinalValue: 9,
    smallValue: 9,
    atbashPair: 'nun',
    keywords: Object.freeze(['serpent', 'goodness', 'hidden', 'feminine']),
    keywordsHebrew: Object.freeze(['נחש', 'טוב', 'נסתר', 'נקבי']),
  },
  {
    id: 'yod',
    number: 10,
    letter: 'י',
    name: 'Yod',
    nameHebrew: 'יוד',
    standardValue: 10,
    ordinalValue: 10,
    smallValue: 1,
    atbashPair: 'mem',
    keywords: Object.freeze(['hand', 'point', 'divine spark', 'creation']),
    keywordsHebrew: Object.freeze(['יד', 'נקודה', 'ניצוץ אלוהי', 'בריאה']),
  },
  {
    id: 'kaf',
    number: 11,
    letter: 'כ',
    name: 'Kaf',
    nameHebrew: 'כף',
    standardValue: 20,
    ordinalValue: 11,
    smallValue: 2,
    atbashPair: 'lamed',
    finalForm: 'ך',
    finalValue: 500,
    keywords: Object.freeze(['palm', 'crown', 'actualization', 'potential']),
    keywordsHebrew: Object.freeze(['כף', 'כתר', 'מימוש', 'פוטנציאל']),
  },
  {
    id: 'lamed',
    number: 12,
    letter: 'ל',
    name: 'Lamed',
    nameHebrew: 'למד',
    standardValue: 30,
    ordinalValue: 12,
    smallValue: 3,
    atbashPair: 'kaf',
    keywords: Object.freeze(['goad', 'learning', 'teaching', 'aspiration']),
    keywordsHebrew: Object.freeze(['מלמד', 'לימוד', 'הוראה', 'שאיפה']),
  },
  {
    id: 'mem',
    number: 13,
    letter: 'מ',
    name: 'Mem',
    nameHebrew: 'מם',
    standardValue: 40,
    ordinalValue: 13,
    smallValue: 4,
    atbashPair: 'yod',
    finalForm: 'ם',
    finalValue: 600,
    keywords: Object.freeze(['water', 'revealed', 'concealed', 'womb']),
    keywordsHebrew: Object.freeze(['מים', 'גלוי', 'נסתר', 'רחם']),
  },
  {
    id: 'nun',
    number: 14,
    letter: 'נ',
    name: 'Nun',
    nameHebrew: 'נון',
    standardValue: 50,
    ordinalValue: 14,
    smallValue: 5,
    atbashPair: 'tet',
    finalForm: 'ן',
    finalValue: 700,
    keywords: Object.freeze(['fish', 'soul', 'emergence', 'faithfulness']),
    keywordsHebrew: Object.freeze(['דג', 'נשמה', 'צמיחה', 'נאמנות']),
  },
  {
    id: 'samech',
    number: 15,
    letter: 'ס',
    name: 'Samech',
    nameHebrew: 'סמך',
    standardValue: 60,
    ordinalValue: 15,
    smallValue: 6,
    atbashPair: 'chet',
    keywords: Object.freeze(['support', 'circle', 'protection', 'trust']),
    keywordsHebrew: Object.freeze(['סמיכה', 'מעגל', 'הגנה', 'אמון']),
  },
  {
    id: 'ayin',
    number: 16,
    letter: 'ע',
    name: 'Ayin',
    nameHebrew: 'עין',
    standardValue: 70,
    ordinalValue: 16,
    smallValue: 7,
    atbashPair: 'zayin',
    keywords: Object.freeze(['eye', 'insight', 'perception', 'fountain']),
    keywordsHebrew: Object.freeze(['עין', 'תובנה', 'תפיסה', 'מעיין']),
  },
  {
    id: 'pe',
    number: 17,
    letter: 'פ',
    name: 'Pe',
    nameHebrew: 'פא',
    standardValue: 80,
    ordinalValue: 17,
    smallValue: 8,
    atbashPair: 'vav',
    finalForm: 'ף',
    finalValue: 800,
    keywords: Object.freeze(['mouth', 'speech', 'expression', 'breath']),
    keywordsHebrew: Object.freeze(['פה', 'דיבור', 'ביטוי', 'נשימה']),
  },
  {
    id: 'tsadi',
    number: 18,
    letter: 'צ',
    name: 'Tsadi',
    nameHebrew: 'צדי',
    standardValue: 90,
    ordinalValue: 18,
    smallValue: 9,
    atbashPair: 'he',
    finalForm: 'ץ',
    finalValue: 900,
    keywords: Object.freeze(['righteousness', 'tzaddik', 'hunting', 'desire']),
    keywordsHebrew: Object.freeze(['צדקה', 'צדיק', 'ציד', 'רצון']),
  },
  {
    id: 'qof',
    number: 19,
    letter: 'ק',
    name: 'Qof',
    nameHebrew: 'קוף',
    standardValue: 100,
    ordinalValue: 19,
    smallValue: 1,
    atbashPair: 'dalet',
    keywords: Object.freeze(['back of head', 'holiness', 'cycle', 'monkey']),
    keywordsHebrew: Object.freeze(['עורף', 'קדושה', 'מחזור', 'קוף']),
  },
  {
    id: 'resh',
    number: 20,
    letter: 'ר',
    name: 'Resh',
    nameHebrew: 'ריש',
    standardValue: 200,
    ordinalValue: 20,
    smallValue: 2,
    atbashPair: 'gimel',
    keywords: Object.freeze(['head', 'beginning', 'poverty', 'process']),
    keywordsHebrew: Object.freeze(['ראש', 'התחלה', 'ריש', 'תהליך']),
  },
  {
    id: 'shin',
    number: 21,
    letter: 'ש',
    name: 'Shin',
    nameHebrew: 'שין',
    standardValue: 300,
    ordinalValue: 21,
    smallValue: 3,
    atbashPair: 'bet',
    keywords: Object.freeze(['tooth', 'fire', 'transformation', 'change']),
    keywordsHebrew: Object.freeze(['שן', 'אש', 'המרה', 'שינוי']),
  },
  {
    id: 'tav',
    number: 22,
    letter: 'ת',
    name: 'Tav',
    nameHebrew: 'תו',
    standardValue: 400,
    ordinalValue: 22,
    smallValue: 4,
    atbashPair: 'aleph',
    keywords: Object.freeze(['mark', 'seal', 'truth', 'completion']),
    keywordsHebrew: Object.freeze(['סימן', 'חותם', 'אמת', 'השלמה']),
  },
])

// =============================================================================
// FINAL LETTER FORMS
// =============================================================================

export interface FinalLetterForm {
  readonly id: AllHebrewLetterId
  readonly letter: string
  readonly baseLetterId: HebrewLetterId
  readonly standardValue: number    // Same as base letter in standard method
  readonly fullValue: number        // Higher value in full method (500-900)
}

export const FINAL_LETTER_FORMS: readonly FinalLetterForm[] = Object.freeze([
  { id: 'kaf-final', letter: 'ך', baseLetterId: 'kaf', standardValue: 20, fullValue: 500 },
  { id: 'mem-final', letter: 'ם', baseLetterId: 'mem', standardValue: 40, fullValue: 600 },
  { id: 'nun-final', letter: 'ן', baseLetterId: 'nun', standardValue: 50, fullValue: 700 },
  { id: 'pe-final', letter: 'ף', baseLetterId: 'pe', standardValue: 80, fullValue: 800 },
  { id: 'tsadi-final', letter: 'ץ', baseLetterId: 'tsadi', standardValue: 90, fullValue: 900 },
])

// =============================================================================
// LOOKUP MAPS
// =============================================================================

/**
 * Map from Hebrew letter character to letter data
 */
export const LETTER_BY_CHAR: Readonly<Record<string, HebrewLetter>> = Object.freeze(
  Object.fromEntries(HEBREW_LETTERS.map(l => [l.letter, l]))
)

/**
 * Map from final form character to final form data
 */
export const FINAL_BY_CHAR: Readonly<Record<string, FinalLetterForm>> = Object.freeze(
  Object.fromEntries(FINAL_LETTER_FORMS.map(f => [f.letter, f]))
)

/**
 * Map from letter ID to letter data
 */
export const LETTER_BY_ID: Readonly<Record<HebrewLetterId, HebrewLetter>> = Object.freeze(
  Object.fromEntries(HEBREW_LETTERS.map(l => [l.id, l])) as Record<HebrewLetterId, HebrewLetter>
)

/**
 * All Hebrew characters (base + final forms)
 */
export const ALL_HEBREW_CHARS: readonly string[] = Object.freeze([
  ...HEBREW_LETTERS.map(l => l.letter),
  ...FINAL_LETTER_FORMS.map(f => f.letter),
])

// =============================================================================
// NOTABLE NUMBERS DATABASE
// =============================================================================

export const NOTABLE_NUMBERS: readonly NotableNumber[] = Object.freeze([
  { value: 1, meaning: 'Unity (Echad)', meaningHebrew: 'אחד - יחידות', source: 'Fundamental' },
  { value: 13, meaning: 'Love (Ahavah)', meaningHebrew: 'אהבה', source: 'אהבה = 1+5+2+5 = 13' },
  { value: 18, meaning: 'Life (Chai)', meaningHebrew: 'חי - חיים', source: 'חי = 8+10 = 18' },
  { value: 26, meaning: 'YHVH (Tetragrammaton)', meaningHebrew: 'יהוה - השם', source: 'יהוה = 10+5+6+5 = 26' },
  { value: 32, meaning: 'Heart (Lev)', meaningHebrew: 'לב - לבב', source: 'לב = 30+2 = 32' },
  { value: 36, meaning: 'Hidden righteous (Lamed-Vav)', meaningHebrew: 'ל"ו צדיקים', source: 'ל+ו = 30+6 = 36' },
  { value: 42, meaning: '42-Letter Name', meaningHebrew: 'שם מ"ב', source: 'Divine name of creation' },
  { value: 45, meaning: 'Adam (Man)', meaningHebrew: 'אדם', source: 'אדם = 1+4+40 = 45' },
  { value: 50, meaning: 'Gates of Understanding', meaningHebrew: 'נ\' שערי בינה', source: 'Sefirah of Binah' },
  { value: 52, meaning: 'Son (Ben)', meaningHebrew: 'בן', source: 'בן = 2+50 = 52' },
  { value: 72, meaning: '72-Letter Name', meaningHebrew: 'שם ע"ב', source: 'Shem HaMephorash' },
  { value: 86, meaning: 'Elohim (God)', meaningHebrew: 'אלהים', source: 'אלהים = 1+30+5+10+40 = 86' },
  { value: 91, meaning: 'Amen', meaningHebrew: 'אמן', source: 'אמן = 1+40+50 = 91' },
  { value: 100, meaning: 'Blessings per day', meaningHebrew: 'מאה ברכות', source: 'Traditional practice' },
  { value: 112, meaning: 'YHVH Elohim', meaningHebrew: 'יהוה אלהים', source: '26 + 86 = 112' },
  { value: 137, meaning: 'Kabbalah', meaningHebrew: 'קבלה', source: 'קבלה = 100+2+30+5 = 137' },
  { value: 248, meaning: 'Positive commandments', meaningHebrew: 'רמ"ח מצוות עשה', source: 'Taryag mitzvot' },
  { value: 358, meaning: 'Messiah (Mashiach)', meaningHebrew: 'משיח', source: 'משיח = 40+300+10+8 = 358' },
  { value: 365, meaning: 'Negative commandments', meaningHebrew: 'שס"ה מצוות לא תעשה', source: 'Taryag mitzvot' },
  { value: 400, meaning: 'Final letter (Tav)', meaningHebrew: 'תו - סוף האותיות', source: 'Last letter value' },
  { value: 541, meaning: 'Israel', meaningHebrew: 'ישראל', source: 'ישראל = 10+300+200+1+30 = 541' },
  { value: 613, meaning: 'Total commandments', meaningHebrew: 'תרי"ג מצוות', source: '248 + 365 = 613' },
])

/**
 * Map from number to notable number data
 */
export const NOTABLE_BY_VALUE: Readonly<Record<number, NotableNumber>> = Object.freeze(
  Object.fromEntries(NOTABLE_NUMBERS.map(n => [n.value, n]))
)

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get Hebrew letter by ID
 */
export function getLetterById(id: HebrewLetterId): HebrewLetter {
  const letter = LETTER_BY_ID[id]
  if (!letter) throw new Error(`Unknown Hebrew letter ID: ${id}`)
  return letter
}

/**
 * Get Hebrew letter by character
 */
export function getLetterByChar(char: string): HebrewLetter | null {
  return LETTER_BY_CHAR[char] ?? null
}

/**
 * Get final form by character
 */
export function getFinalByChar(char: string): FinalLetterForm | null {
  return FINAL_BY_CHAR[char] ?? null
}

/**
 * Check if character is a Hebrew letter (base or final form)
 */
export function isHebrewLetter(char: string): boolean {
  return char in LETTER_BY_CHAR || char in FINAL_BY_CHAR
}

/**
 * Check if character is a final form letter
 */
export function isFinalForm(char: string): boolean {
  return char in FINAL_BY_CHAR
}

/**
 * Get notable number interpretation if exists
 */
export function getNotableNumber(value: number): NotableNumber | null {
  return NOTABLE_BY_VALUE[value] ?? null
}

/**
 * Get AtBash pair letter for a given letter
 */
export function getAtBashPair(letterId: HebrewLetterId): HebrewLetter {
  const letter = LETTER_BY_ID[letterId]
  if (!letter) throw new Error(`Unknown Hebrew letter ID: ${letterId}`)
  return LETTER_BY_ID[letter.atbashPair]
}

/**
 * Get Avgad (next letter) for a given letter
 * Wraps around: Tav -> Aleph
 */
export function getAvgadLetter(letterId: HebrewLetterId): HebrewLetter {
  const letter = LETTER_BY_ID[letterId]
  if (!letter) throw new Error(`Unknown Hebrew letter ID: ${letterId}`)
  const nextNumber = letter.number === 22 ? 1 : letter.number + 1
  return HEBREW_LETTERS[nextNumber - 1]
}

/**
 * Get Albam pair (half-alphabet cipher) for a given letter
 * 1-11 maps to 12-22 and vice versa
 */
export function getAlbamPair(letterId: HebrewLetterId): HebrewLetter {
  const letter = LETTER_BY_ID[letterId]
  if (!letter) throw new Error(`Unknown Hebrew letter ID: ${letterId}`)
  const pairNumber = letter.number <= 11 ? letter.number + 11 : letter.number - 11
  return HEBREW_LETTERS[pairNumber - 1]
}
