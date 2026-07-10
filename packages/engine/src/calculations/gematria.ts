/**
 * Gematria Calculations
 *
 * Implements Hebrew gematria calculations using multiple methods:
 * - Standard (Mispar Hechrachi)
 * - Full (Mispar Gadol) - Final letters have high values
 * - Small (Mispar Katan) - Reduce to single digit
 * - Ordinal (Mispar Siduri) - Position in alphabet
 * - AtBash - Reversal cipher
 * - Avgad - Next letter cipher
 * - Albam - Half-alphabet cipher
 */

import type {
  GematriaMethod,
  GematriaResult,
  GematriaValue,
  LetterBreakdown,
  NameGematria,
  NameComparison,
  GroupGematria,
  AllHebrewLetterId,
} from '../types/gematria'

import {
  HEBREW_LETTERS,
  LETTER_BY_CHAR,
  FINAL_BY_CHAR,
  getLetterByChar,
  getFinalByChar,
  getAtBashPair,
  getAvgadLetter,
  getAlbamPair,
  getNotableNumber,
} from '../data/hebrew-letters'

// =============================================================================
// TEXT CLEANING
// =============================================================================

/**
 * Unicode range for Hebrew vowel points (nikud)
 * Removes all marks in the range U+0591 to U+05C7
 */
const NIKUD_REGEX = /[\u0591-\u05C7]/g

/**
 * Clean Hebrew text by removing vowel points and normalizing
 */
export function cleanHebrewText(text: string): string {
  return text
    .replace(NIKUD_REGEX, '')  // Remove nikud (vowel points)
    .replace(/\s+/g, ' ')      // Normalize whitespace
    .trim()
}

/**
 * Extract only Hebrew letters from text (no spaces, punctuation)
 */
export function extractHebrewLetters(text: string): string {
  const cleaned = cleanHebrewText(text)
  return cleaned.split('').filter(char => {
    return char in LETTER_BY_CHAR || char in FINAL_BY_CHAR
  }).join('')
}

/**
 * Check if character is a Hebrew letter
 */
export function isHebrewChar(char: string): boolean {
  return char in LETTER_BY_CHAR || char in FINAL_BY_CHAR
}

// =============================================================================
// DIGITAL ROOT
// =============================================================================

/**
 * Calculate digital root (reduce number to single digit 1-9)
 * Example: 358 -> 3+5+8 = 16 -> 1+6 = 7
 */
export function digitalRoot(n: number): number {
  if (n === 0) return 0
  const absN = Math.abs(n)
  return 1 + ((absN - 1) % 9)
}

// =============================================================================
// SINGLE LETTER VALUE CALCULATIONS
// =============================================================================

/**
 * Get standard gematria value for a character
 * Final forms use base letter value in standard method
 */
function getStandardValue(char: string): number {
  const letter = getLetterByChar(char)
  if (letter) return letter.standardValue

  const final = getFinalByChar(char)
  if (final) return final.standardValue

  return 0
}

/**
 * Get full (Mispar Gadol) value - final letters have high values (500-900)
 */
function getFullValue(char: string): number {
  const letter = getLetterByChar(char)
  if (letter) return letter.standardValue

  const final = getFinalByChar(char)
  if (final) return final.fullValue

  return 0
}

/**
 * Get small (Mispar Katan) value - reduce to single digit
 */
function getSmallValue(char: string): number {
  const letter = getLetterByChar(char)
  if (letter) return letter.smallValue

  // Final forms use base letter's small value
  const final = getFinalByChar(char)
  if (final) {
    const baseLetter = HEBREW_LETTERS.find(l => l.id === final.baseLetterId)
    return baseLetter?.smallValue ?? 0
  }

  return 0
}

/**
 * Get ordinal (Mispar Siduri) value - position in alphabet (1-22)
 */
function getOrdinalValue(char: string): number {
  const letter = getLetterByChar(char)
  if (letter) return letter.ordinalValue

  // Final forms use base letter's ordinal value
  const final = getFinalByChar(char)
  if (final) {
    const baseLetter = HEBREW_LETTERS.find(l => l.id === final.baseLetterId)
    return baseLetter?.ordinalValue ?? 0
  }

  return 0
}

/**
 * Get AtBash value - reversal cipher (א↔ת, ב↔ש, etc.)
 */
function getAtBashValue(char: string): number {
  const letter = getLetterByChar(char)
  if (letter) {
    const pair = getAtBashPair(letter.id)
    return pair.standardValue
  }

  // Final forms: use base letter's atbash
  const final = getFinalByChar(char)
  if (final) {
    const baseLetter = HEBREW_LETTERS.find(l => l.id === final.baseLetterId)
    if (baseLetter) {
      const pair = getAtBashPair(baseLetter.id)
      return pair.standardValue
    }
  }

  return 0
}

/**
 * Get Avgad value - next letter cipher
 */
function getAvgadValue(char: string): number {
  const letter = getLetterByChar(char)
  if (letter) {
    const next = getAvgadLetter(letter.id)
    return next.standardValue
  }

  // Final forms: use base letter's avgad
  const final = getFinalByChar(char)
  if (final) {
    const baseLetter = HEBREW_LETTERS.find(l => l.id === final.baseLetterId)
    if (baseLetter) {
      const next = getAvgadLetter(baseLetter.id)
      return next.standardValue
    }
  }

  return 0
}

/**
 * Get Albam value - half-alphabet cipher (letters 1-11 ↔ 12-22)
 */
function getAlbamValue(char: string): number {
  const letter = getLetterByChar(char)
  if (letter) {
    const pair = getAlbamPair(letter.id)
    return pair.standardValue
  }

  // Final forms: use base letter's albam
  const final = getFinalByChar(char)
  if (final) {
    const baseLetter = HEBREW_LETTERS.find(l => l.id === final.baseLetterId)
    if (baseLetter) {
      const pair = getAlbamPair(baseLetter.id)
      return pair.standardValue
    }
  }

  return 0
}

// =============================================================================
// LETTER BREAKDOWN HELPERS
// =============================================================================

/**
 * Get letter ID for a character
 */
function getLetterId(char: string): AllHebrewLetterId {
  const letter = getLetterByChar(char)
  if (letter) return letter.id

  const final = getFinalByChar(char)
  if (final) return final.id

  throw new Error(`Unknown Hebrew character: ${char}`)
}

/**
 * Get letter name for a character
 */
function getLetterName(char: string): string {
  const letter = getLetterByChar(char)
  if (letter) return letter.name

  const final = getFinalByChar(char)
  if (final) {
    const baseLetter = HEBREW_LETTERS.find(l => l.id === final.baseLetterId)
    return baseLetter ? `${baseLetter.name} (final)` : 'Unknown'
  }

  return 'Unknown'
}

/**
 * Create letter breakdown for a character with given value
 */
function createBreakdown(char: string, value: number): LetterBreakdown {
  return {
    letter: char,
    letterId: getLetterId(char),
    name: getLetterName(char),
    value,
    isFinal: char in FINAL_BY_CHAR,
  }
}

// =============================================================================
// GEMATRIA VALUE CALCULATION
// =============================================================================

/**
 * Get value getter function for a method
 */
function getValueGetter(method: GematriaMethod): (char: string) => number {
  switch (method) {
    case 'standard': return getStandardValue
    case 'full': return getFullValue
    case 'small': return getSmallValue
    case 'ordinal': return getOrdinalValue
    case 'atbash': return getAtBashValue
    case 'avgad': return getAvgadValue
    case 'albam': return getAlbamValue
    default: return getStandardValue
  }
}

/**
 * Calculate gematria value for text using specified method
 */
export function calculateGematriaValue(text: string, method: GematriaMethod): GematriaValue {
  const letters = extractHebrewLetters(text)
  const getValue = getValueGetter(method)

  let total = 0
  const breakdown: LetterBreakdown[] = []

  for (const char of letters) {
    const value = getValue(char)
    total += value
    breakdown.push(createBreakdown(char, value))
  }

  return {
    method,
    value: total,
    breakdown: Object.freeze(breakdown),
    digitalRoot: digitalRoot(total),
  }
}

// =============================================================================
// MAIN GEMATRIA CALCULATION
// =============================================================================

/**
 * Calculate full gematria analysis for text using all methods
 */
export function calculateGematria(text: string): GematriaResult {
  const cleaned = cleanHebrewText(text)
  const letters = extractHebrewLetters(text)

  return {
    text,
    cleanedText: cleaned,
    letterCount: letters.length,
    methods: {
      standard: calculateGematriaValue(text, 'standard'),
      full: calculateGematriaValue(text, 'full'),
      small: calculateGematriaValue(text, 'small'),
      ordinal: calculateGematriaValue(text, 'ordinal'),
      atbash: calculateGematriaValue(text, 'atbash'),
      avgad: calculateGematriaValue(text, 'avgad'),
      albam: calculateGematriaValue(text, 'albam'),
    },
  }
}

/**
 * Quick standard gematria calculation (returns just the value)
 */
export function standardGematria(text: string): number {
  return calculateGematriaValue(text, 'standard').value
}

// =============================================================================
// NAME ANALYSIS
// =============================================================================

/**
 * Analyze gematria for a full name with optional components
 */
export function analyzeNameGematria(
  firstName: string,
  lastName?: string | null,
  fatherName?: string | null
): NameGematria {
  const parts = [firstName]
  if (lastName) parts.push(lastName)
  if (fatherName) parts.push(fatherName)
  const fullName = parts.join(' ')

  return {
    firstName,
    lastName: lastName ?? null,
    fatherName: fatherName ?? null,
    fullName,
    analysis: calculateGematria(fullName),
    firstNameAnalysis: calculateGematria(firstName),
    lastNameAnalysis: lastName ? calculateGematria(lastName) : null,
    fatherNameAnalysis: fatherName ? calculateGematria(fatherName) : null,
  }
}

// =============================================================================
// NAME COMPARISON
// =============================================================================

/**
 * Get interpretation for a combined value
 */
function getCombinedInterpretation(value: number): { meaning: string | null; meaningHebrew: string | null } {
  const notable = getNotableNumber(value)
  if (notable) {
    return { meaning: notable.meaning, meaningHebrew: notable.meaningHebrew }
  }

  // Check digital root interpretation
  const root = digitalRoot(value)
  const rootInterpretations: Record<number, { meaning: string; meaningHebrew: string }> = {
    1: { meaning: 'Unity and new beginnings', meaningHebrew: 'אחדות והתחלות חדשות' },
    2: { meaning: 'Partnership and balance', meaningHebrew: 'שותפות ואיזון' },
    3: { meaning: 'Creative expression', meaningHebrew: 'ביטוי יצירתי' },
    4: { meaning: 'Stability and foundation', meaningHebrew: 'יציבות ויסוד' },
    5: { meaning: 'Change and freedom', meaningHebrew: 'שינוי וחופש' },
    6: { meaning: 'Harmony and responsibility', meaningHebrew: 'הרמוניה ואחריות' },
    7: { meaning: 'Spiritual wisdom', meaningHebrew: 'חכמה רוחנית' },
    8: { meaning: 'Abundance and power', meaningHebrew: 'שפע וכוח' },
    9: { meaning: 'Completion and humanitarianism', meaningHebrew: 'השלמה ואנושיות' },
  }

  return rootInterpretations[root] ?? { meaning: null, meaningHebrew: null }
}

/**
 * Compare gematria values of two names
 */
export function compareNames(name1: string, name2: string): NameComparison {
  const value1 = standardGematria(name1)
  const value2 = standardGematria(name2)
  const combinedValue = value1 + value2
  const root1 = digitalRoot(value1)
  const root2 = digitalRoot(value2)

  const interpretation = getCombinedInterpretation(combinedValue)

  return {
    name1,
    name2,
    value1,
    value2,
    combinedValue,
    difference: Math.abs(value1 - value2),
    digitalRootCombined: digitalRoot(combinedValue),
    sharedDigitalRoot: root1 === root2,
    interpretation: interpretation.meaning,
    interpretationHebrew: interpretation.meaningHebrew,
  }
}

// =============================================================================
// GROUP ANALYSIS
// =============================================================================

/**
 * Find all pairs with matching gematria values in a group
 */
function findMatchingPairs(names: readonly string[]): NameComparison[] {
  const pairs: NameComparison[] = []
  const values = names.map(name => standardGematria(name))

  for (let i = 0; i < names.length; i++) {
    for (let j = i + 1; j < names.length; j++) {
      // Check if values are equal or if digital roots match
      if (values[i] === values[j] || digitalRoot(values[i]) === digitalRoot(values[j])) {
        pairs.push(compareNames(names[i], names[j]))
      }
    }
  }

  return pairs
}

/**
 * Analyze gematria for a group of names
 */
export function analyzeGroup(names: readonly string[]): GroupGematria {
  const values = names.map(name => standardGematria(name))
  const totalValue = values.reduce((sum, v) => sum + v, 0)

  return {
    names,
    values: Object.freeze(values),
    totalValue,
    averageValue: names.length > 0 ? Math.round(totalValue / names.length) : 0,
    digitalRoot: digitalRoot(totalValue),
    matchingPairs: Object.freeze(findMatchingPairs(names)),
  }
}

// =============================================================================
// NOTABLE NUMBER LOOKUP
// =============================================================================

/**
 * Find equivalent words/meanings for a given gematria value
 */
export function findEquivalentMeanings(value: number): string[] {
  const notable = getNotableNumber(value)
  if (notable) {
    return [notable.meaning]
  }
  return []
}

/**
 * Check if a value has a notable meaning
 */
export function hasNotableMeaning(value: number): boolean {
  return getNotableNumber(value) !== null
}

// =============================================================================
// LETTER ANALYSIS
// =============================================================================

/**
 * Get detailed letter breakdown for text
 */
export function getLetterBreakdown(text: string): readonly LetterBreakdown[] {
  return calculateGematriaValue(text, 'standard').breakdown
}

/**
 * Count occurrences of each letter in text
 */
export function countLetters(text: string): Map<string, number> {
  const letters = extractHebrewLetters(text)
  const counts = new Map<string, number>()

  for (const char of letters) {
    counts.set(char, (counts.get(char) ?? 0) + 1)
  }

  return counts
}

// =============================================================================
// SUMMARY AND DISPLAY HELPERS
// =============================================================================

/**
 * Get summary of gematria result for display
 */
export function getGematriaSummary(result: GematriaResult): {
  standardValue: number
  ordinalValue: number
  smallValue: number
  digitalRoot: number
  letterCount: number
} {
  return {
    standardValue: result.methods.standard.value,
    ordinalValue: result.methods.ordinal.value,
    smallValue: result.methods.small.value,
    digitalRoot: result.methods.standard.digitalRoot,
    letterCount: result.letterCount,
  }
}

/**
 * Format gematria value with Hebrew numerals (optional)
 */
export function formatGematriaValue(value: number): string {
  return value.toLocaleString('he-IL')
}
