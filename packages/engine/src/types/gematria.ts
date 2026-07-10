/**
 * Gematria Type Definitions
 *
 * Gematria is the ancient Hebrew numerological system that assigns numerical values
 * to Hebrew letters, words, and phrases. This module defines types for multiple
 * calculation methods and name analysis.
 */

// =============================================================================
// SCALAR TYPES
// =============================================================================

/**
 * Hebrew letter identifiers (22 base letters)
 */
export type HebrewLetterId =
  | 'aleph'
  | 'bet'
  | 'gimel'
  | 'dalet'
  | 'he'
  | 'vav'
  | 'zayin'
  | 'chet'
  | 'tet'
  | 'yod'
  | 'kaf'
  | 'lamed'
  | 'mem'
  | 'nun'
  | 'samech'
  | 'ayin'
  | 'pe'
  | 'tsadi'
  | 'qof'
  | 'resh'
  | 'shin'
  | 'tav'

/**
 * Final form letter identifiers (5 letters with final forms)
 */
export type FinalLetterId =
  | 'kaf-final'
  | 'mem-final'
  | 'nun-final'
  | 'pe-final'
  | 'tsadi-final'

/**
 * All Hebrew letter identifiers including final forms
 */
export type AllHebrewLetterId = HebrewLetterId | FinalLetterId

/**
 * Gematria calculation methods
 */
export type GematriaMethod =
  | 'standard'  // Mispar Hechrachi - Standard value (1-400)
  | 'full'      // Mispar Gadol - Final letters have high values (500-900)
  | 'small'     // Mispar Katan - Reduce each letter to single digit (1-9)
  | 'ordinal'   // Mispar Siduri - Position in alphabet (1-22)
  | 'atbash'    // Reversal cipher (first mirrors last)
  | 'avgad'     // Next letter cipher
  | 'albam'     // Half-alphabet cipher

// =============================================================================
// DATA STRUCTURES
// =============================================================================

/**
 * Hebrew letter definition with all values and metadata
 */
export interface HebrewLetter {
  readonly id: HebrewLetterId
  readonly number: number           // Position in alphabet (1-22)
  readonly letter: string           // Hebrew letter character (א, ב, etc.)
  readonly name: string             // English name (Aleph, Bet, etc.)
  readonly nameHebrew: string       // Hebrew name (אלף, בית, etc.)
  readonly standardValue: number    // Standard gematria value (1-400)
  readonly ordinalValue: number     // Position value (1-22)
  readonly smallValue: number       // Reduced value (1-9)
  readonly atbashPair: HebrewLetterId  // AtBash cipher pair
  readonly finalForm?: string       // Final form character if applicable
  readonly finalValue?: number      // Final form value if applicable
  readonly keywords: readonly string[]
  readonly keywordsHebrew: readonly string[]
}

/**
 * Letter breakdown in a gematria calculation
 */
export interface LetterBreakdown {
  readonly letter: string           // The Hebrew letter character
  readonly letterId: AllHebrewLetterId
  readonly name: string             // Letter name
  readonly value: number            // Value used in this calculation
  readonly isFinal: boolean         // Whether this is a final form
}

/**
 * Result of a single gematria calculation
 */
export interface GematriaValue {
  readonly method: GematriaMethod
  readonly value: number
  readonly breakdown: readonly LetterBreakdown[]
  readonly digitalRoot: number      // Single digit reduction (1-9)
}

/**
 * Complete gematria analysis for text
 */
export interface GematriaResult {
  readonly text: string             // Original Hebrew text
  readonly cleanedText: string      // Text with nikud removed
  readonly letterCount: number      // Number of Hebrew letters
  readonly methods: {
    readonly standard: GematriaValue
    readonly full: GematriaValue
    readonly small: GematriaValue
    readonly ordinal: GematriaValue
    readonly atbash: GematriaValue
    readonly avgad: GematriaValue
    readonly albam: GematriaValue
  }
}

// =============================================================================
// NAME ANALYSIS TYPES
// =============================================================================

/**
 * Full name gematria analysis
 */
export interface NameGematria {
  readonly firstName: string
  readonly lastName: string | null
  readonly fatherName: string | null
  readonly fullName: string
  readonly analysis: GematriaResult
  readonly firstNameAnalysis: GematriaResult | null
  readonly lastNameAnalysis: GematriaResult | null
  readonly fatherNameAnalysis: GematriaResult | null
}

/**
 * Comparison between two names
 */
export interface NameComparison {
  readonly name1: string
  readonly name2: string
  readonly value1: number           // Standard gematria of name1
  readonly value2: number           // Standard gematria of name2
  readonly combinedValue: number    // Sum of both values
  readonly difference: number       // Absolute difference
  readonly digitalRootCombined: number
  readonly sharedDigitalRoot: boolean
  readonly interpretation: string | null
  readonly interpretationHebrew: string | null
}

/**
 * Group gematria analysis
 */
export interface GroupGematria {
  readonly names: readonly string[]
  readonly values: readonly number[]
  readonly totalValue: number
  readonly averageValue: number
  readonly digitalRoot: number
  readonly matchingPairs: readonly NameComparison[]
}

// =============================================================================
// NOTABLE NUMBERS DATABASE
// =============================================================================

/**
 * Notable number with interpretation
 */
export interface NotableNumber {
  readonly value: number
  readonly meaning: string
  readonly meaningHebrew: string
  readonly source: string           // Traditional source reference
}

// =============================================================================
// PERSON GEMATRIA (for storage)
// =============================================================================

/**
 * Stored gematria result for a person
 */
export interface PersonGematria {
  readonly personId: string
  readonly name: string
  readonly standardValue: number
  readonly ordinalValue: number
  readonly smallValue: number
  readonly digitalRoot: number
  readonly calculatedAt: string     // ISO date string
}

// =============================================================================
// DISPLAY LABELS
// =============================================================================

/**
 * Labels for gematria methods
 */
export const GEMATRIA_METHOD_LABELS: Readonly<Record<GematriaMethod, { label: string; labelHebrew: string; description: string }>> = {
  standard: {
    label: 'Standard',
    labelHebrew: 'מספר הכרחי',
    description: 'Traditional value assignment (1-400)',
  },
  full: {
    label: 'Full',
    labelHebrew: 'מספר גדול',
    description: 'Final letters have high values (500-900)',
  },
  small: {
    label: 'Small',
    labelHebrew: 'מספר קטן',
    description: 'Reduce each letter to single digit (1-9)',
  },
  ordinal: {
    label: 'Ordinal',
    labelHebrew: 'מספר סידורי',
    description: 'Position in alphabet (1-22)',
  },
  atbash: {
    label: 'AtBash',
    labelHebrew: 'אתב"ש',
    description: 'Reversal cipher (first letter mirrors last)',
  },
  avgad: {
    label: 'Avgad',
    labelHebrew: 'אבג"ד',
    description: 'Next letter cipher',
  },
  albam: {
    label: 'Albam',
    labelHebrew: 'אלב"ם',
    description: 'Half-alphabet cipher',
  },
}

/**
 * Labels for digital root meanings
 */
export const DIGITAL_ROOT_LABELS: Readonly<Record<number, { meaning: string; meaningHebrew: string }>> = {
  1: { meaning: 'Unity, Beginning', meaningHebrew: 'אחדות, התחלה' },
  2: { meaning: 'Duality, Partnership', meaningHebrew: 'דואליות, שותפות' },
  3: { meaning: 'Creativity, Expression', meaningHebrew: 'יצירתיות, ביטוי' },
  4: { meaning: 'Foundation, Stability', meaningHebrew: 'יסוד, יציבות' },
  5: { meaning: 'Change, Freedom', meaningHebrew: 'שינוי, חופש' },
  6: { meaning: 'Harmony, Balance', meaningHebrew: 'הרמוניה, איזון' },
  7: { meaning: 'Spirituality, Wisdom', meaningHebrew: 'רוחניות, חכמה' },
  8: { meaning: 'Power, Abundance', meaningHebrew: 'כוח, שפע' },
  9: { meaning: 'Completion, Mastery', meaningHebrew: 'השלמה, שליטה' },
}
