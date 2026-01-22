/**
 * Gematria Calculations Tests
 *
 * Tests for Hebrew gematria calculation methods, text processing,
 * and name analysis functions.
 */

import { describe, it, expect } from 'vitest'
import {
  cleanHebrewText,
  extractHebrewLetters,
  isHebrewChar,
  digitalRoot,
  calculateGematriaValue,
  calculateGematria,
  standardGematria,
  analyzeNameGematria,
  compareNames,
  analyzeGroup,
  findEquivalentMeanings,
  hasNotableMeaning,
  getLetterBreakdown,
  countLetters,
  getGematriaSummary,
} from './gematria'
import {
  HEBREW_LETTERS,
  FINAL_LETTER_FORMS,
  NOTABLE_NUMBERS,
  getLetterById,
  getAtBashPair,
  getAvgadLetter,
  getAlbamPair,
} from '../data/hebrew-letters'

// =============================================================================
// DATA VALIDATION TESTS
// =============================================================================

describe('Hebrew Letters Data', () => {
  it('should have exactly 22 base letters', () => {
    expect(HEBREW_LETTERS).toHaveLength(22)
  })

  it('should have exactly 5 final form letters', () => {
    expect(FINAL_LETTER_FORMS).toHaveLength(5)
  })

  it('should have unique letter IDs', () => {
    const ids = HEBREW_LETTERS.map(l => l.id)
    const uniqueIds = new Set(ids)
    expect(uniqueIds.size).toBe(22)
  })

  it('should have unique letter characters', () => {
    const chars = HEBREW_LETTERS.map(l => l.letter)
    const uniqueChars = new Set(chars)
    expect(uniqueChars.size).toBe(22)
  })

  it('should have correct ordinal values 1-22', () => {
    HEBREW_LETTERS.forEach((letter, index) => {
      expect(letter.ordinalValue).toBe(index + 1)
    })
  })

  it('should have small values between 1-9', () => {
    HEBREW_LETTERS.forEach(letter => {
      expect(letter.smallValue).toBeGreaterThanOrEqual(1)
      expect(letter.smallValue).toBeLessThanOrEqual(9)
    })
  })

  it('should have correct standard values pattern', () => {
    // First 9 letters: 1-9
    expect(HEBREW_LETTERS[0].standardValue).toBe(1)   // Aleph
    expect(HEBREW_LETTERS[8].standardValue).toBe(9)   // Tet

    // Next 9 letters: 10-90
    expect(HEBREW_LETTERS[9].standardValue).toBe(10)  // Yod
    expect(HEBREW_LETTERS[17].standardValue).toBe(90) // Tsadi

    // Last 4 letters: 100-400
    expect(HEBREW_LETTERS[18].standardValue).toBe(100) // Qof
    expect(HEBREW_LETTERS[21].standardValue).toBe(400) // Tav
  })

  it('should have valid AtBash pairs', () => {
    // Verify AtBash is symmetric: if A maps to B, B maps to A
    HEBREW_LETTERS.forEach(letter => {
      const pair = getAtBashPair(letter.id)
      const pairOfPair = getAtBashPair(pair.id)
      expect(pairOfPair.id).toBe(letter.id)
    })
  })

  it('should have specific AtBash mappings', () => {
    // Aleph ↔ Tav
    expect(getAtBashPair('aleph').id).toBe('tav')
    expect(getAtBashPair('tav').id).toBe('aleph')

    // Bet ↔ Shin
    expect(getAtBashPair('bet').id).toBe('shin')
    expect(getAtBashPair('shin').id).toBe('bet')
  })
})

describe('Notable Numbers Data', () => {
  it('should have notable numbers', () => {
    expect(NOTABLE_NUMBERS.length).toBeGreaterThan(0)
  })

  it('should have unique values', () => {
    const values = NOTABLE_NUMBERS.map(n => n.value)
    const uniqueValues = new Set(values)
    expect(uniqueValues.size).toBe(NOTABLE_NUMBERS.length)
  })

  it('should include well-known values', () => {
    const values = NOTABLE_NUMBERS.map(n => n.value)
    expect(values).toContain(13)   // Ahavah (Love)
    expect(values).toContain(18)   // Chai (Life)
    expect(values).toContain(26)   // YHVH
    expect(values).toContain(358)  // Mashiach
  })
})

// =============================================================================
// TEXT CLEANING TESTS
// =============================================================================

describe('Text Cleaning', () => {
  describe('cleanHebrewText', () => {
    it('should preserve plain Hebrew text', () => {
      expect(cleanHebrewText('שלום')).toBe('שלום')
    })

    it('should remove nikud (vowel points)', () => {
      // שָׁלוֹם with nikud should become שלום
      expect(cleanHebrewText('שָׁלוֹם')).toBe('שלום')
    })

    it('should normalize whitespace', () => {
      expect(cleanHebrewText('שלום   עולם')).toBe('שלום עולם')
    })

    it('should trim leading/trailing whitespace', () => {
      expect(cleanHebrewText('  שלום  ')).toBe('שלום')
    })
  })

  describe('extractHebrewLetters', () => {
    it('should extract only Hebrew letters', () => {
      expect(extractHebrewLetters('שלום')).toBe('שלום')
    })

    it('should remove spaces', () => {
      expect(extractHebrewLetters('שלום עולם')).toBe('שלוםעולם')
    })

    it('should remove numbers', () => {
      expect(extractHebrewLetters('שלום123')).toBe('שלום')
    })

    it('should include final forms', () => {
      expect(extractHebrewLetters('שלום')).toBe('שלום') // ם is final mem
    })
  })

  describe('isHebrewChar', () => {
    it('should return true for Hebrew letters', () => {
      expect(isHebrewChar('א')).toBe(true)
      expect(isHebrewChar('ת')).toBe(true)
    })

    it('should return true for final forms', () => {
      expect(isHebrewChar('ם')).toBe(true) // Final mem
      expect(isHebrewChar('ך')).toBe(true) // Final kaf
    })

    it('should return false for non-Hebrew characters', () => {
      expect(isHebrewChar('a')).toBe(false)
      expect(isHebrewChar('1')).toBe(false)
      expect(isHebrewChar(' ')).toBe(false)
    })
  })
})

// =============================================================================
// DIGITAL ROOT TESTS
// =============================================================================

describe('Digital Root', () => {
  it('should return single digits unchanged', () => {
    expect(digitalRoot(1)).toBe(1)
    expect(digitalRoot(5)).toBe(5)
    expect(digitalRoot(9)).toBe(9)
  })

  it('should reduce multi-digit numbers', () => {
    expect(digitalRoot(10)).toBe(1) // 1+0 = 1
    expect(digitalRoot(18)).toBe(9) // 1+8 = 9
    expect(digitalRoot(26)).toBe(8) // 2+6 = 8
  })

  it('should handle larger numbers', () => {
    expect(digitalRoot(358)).toBe(7) // 3+5+8 = 16 -> 1+6 = 7
    expect(digitalRoot(541)).toBe(1) // 5+4+1 = 10 -> 1+0 = 1
  })

  it('should return 0 for 0', () => {
    expect(digitalRoot(0)).toBe(0)
  })
})

// =============================================================================
// KNOWN VALUE TESTS (from Gematria spec)
// =============================================================================

describe('Known Gematria Values', () => {
  describe('Standard Method', () => {
    it('should calculate אהבה (Love) = 13', () => {
      // א(1) + ה(5) + ב(2) + ה(5) = 13
      expect(standardGematria('אהבה')).toBe(13)
    })

    it('should calculate חי (Life) = 18', () => {
      // ח(8) + י(10) = 18
      expect(standardGematria('חי')).toBe(18)
    })

    it('should calculate יהוה (YHVH) = 26', () => {
      // י(10) + ה(5) + ו(6) + ה(5) = 26
      expect(standardGematria('יהוה')).toBe(26)
    })

    it('should calculate לב (Heart) = 32', () => {
      // ל(30) + ב(2) = 32
      expect(standardGematria('לב')).toBe(32)
    })

    it('should calculate אדם (Adam) = 45', () => {
      // א(1) + ד(4) + ם(40) = 45
      expect(standardGematria('אדם')).toBe(45)
    })

    it('should calculate אלהים (Elohim) = 86', () => {
      // א(1) + ל(30) + ה(5) + י(10) + ם(40) = 86
      expect(standardGematria('אלהים')).toBe(86)
    })

    it('should calculate אמן (Amen) = 91', () => {
      // א(1) + מ(40) + ן(50) = 91
      expect(standardGematria('אמן')).toBe(91)
    })

    it('should calculate קבלה (Kabbalah) = 137', () => {
      // ק(100) + ב(2) + ל(30) + ה(5) = 137
      expect(standardGematria('קבלה')).toBe(137)
    })

    it('should calculate משיח (Mashiach) = 358', () => {
      // מ(40) + ש(300) + י(10) + ח(8) = 358
      expect(standardGematria('משיח')).toBe(358)
    })

    it('should calculate ישראל (Israel) = 541', () => {
      // י(10) + ש(300) + ר(200) + א(1) + ל(30) = 541
      expect(standardGematria('ישראל')).toBe(541)
    })

    it('should calculate שלום (Shalom) = 376', () => {
      // ש(300) + ל(30) + ו(6) + ם(40) = 376
      expect(standardGematria('שלום')).toBe(376)
    })
  })
})

// =============================================================================
// CALCULATION METHODS TESTS
// =============================================================================

describe('Gematria Methods', () => {
  describe('Standard Method', () => {
    it('should calculate using standard values', () => {
      const result = calculateGematriaValue('אב', 'standard')
      expect(result.value).toBe(3) // א(1) + ב(2) = 3
    })

    it('should use base value for final forms', () => {
      // Final mem (ם) should use 40, not 600
      const result = calculateGematriaValue('אדם', 'standard')
      expect(result.value).toBe(45) // א(1) + ד(4) + ם(40) = 45
    })
  })

  describe('Full Method (Mispar Gadol)', () => {
    it('should use high values for final forms', () => {
      const result = calculateGematriaValue('אדם', 'full')
      expect(result.value).toBe(605) // א(1) + ד(4) + ם(600) = 605
    })
  })

  describe('Small Method (Mispar Katan)', () => {
    it('should reduce to single digits', () => {
      const result = calculateGematriaValue('א', 'small')
      expect(result.value).toBe(1)

      // י = 10 -> small = 1
      const yodResult = calculateGematriaValue('י', 'small')
      expect(yodResult.value).toBe(1)
    })

    it('should sum small values', () => {
      // אב = 1 + 2 = 3
      const result = calculateGematriaValue('אב', 'small')
      expect(result.value).toBe(3)
    })
  })

  describe('Ordinal Method (Mispar Siduri)', () => {
    it('should use position values', () => {
      // א = 1, ב = 2
      const result = calculateGematriaValue('אב', 'ordinal')
      expect(result.value).toBe(3)

      // ת = 22
      const tavResult = calculateGematriaValue('ת', 'ordinal')
      expect(tavResult.value).toBe(22)
    })
  })

  describe('AtBash Method', () => {
    it('should use cipher values', () => {
      // א -> ת (400)
      const result = calculateGematriaValue('א', 'atbash')
      expect(result.value).toBe(400)

      // ת -> א (1)
      const tavResult = calculateGematriaValue('ת', 'atbash')
      expect(tavResult.value).toBe(1)
    })
  })

  describe('Avgad Method', () => {
    it('should use next letter values', () => {
      // א -> ב (2)
      const result = calculateGematriaValue('א', 'avgad')
      expect(result.value).toBe(2)

      // ת -> א (1) - wraps around
      const tavResult = calculateGematriaValue('ת', 'avgad')
      expect(tavResult.value).toBe(1)
    })
  })

  describe('Albam Method', () => {
    it('should use half-alphabet cipher', () => {
      // א (1) -> ל (30) (letters 1-11 map to 12-22)
      const result = calculateGematriaValue('א', 'albam')
      expect(result.value).toBe(30)

      // ל (12) -> א (1) (letters 12-22 map to 1-11)
      const lamedResult = calculateGematriaValue('ל', 'albam')
      expect(lamedResult.value).toBe(1)
    })
  })
})

// =============================================================================
// FULL GEMATRIA RESULT TESTS
// =============================================================================

describe('Full Gematria Calculation', () => {
  it('should return all seven methods', () => {
    const result = calculateGematria('שלום')
    expect(result.methods.standard).toBeDefined()
    expect(result.methods.full).toBeDefined()
    expect(result.methods.small).toBeDefined()
    expect(result.methods.ordinal).toBeDefined()
    expect(result.methods.atbash).toBeDefined()
    expect(result.methods.avgad).toBeDefined()
    expect(result.methods.albam).toBeDefined()
  })

  it('should include letter breakdown', () => {
    const result = calculateGematria('אב')
    const breakdown = result.methods.standard.breakdown
    expect(breakdown).toHaveLength(2)
    expect(breakdown[0].letter).toBe('א')
    expect(breakdown[0].value).toBe(1)
    expect(breakdown[1].letter).toBe('ב')
    expect(breakdown[1].value).toBe(2)
  })

  it('should calculate digital root', () => {
    const result = calculateGematria('משיח')
    expect(result.methods.standard.digitalRoot).toBe(7) // 358 -> 7
  })

  it('should track letter count', () => {
    const result = calculateGematria('שלום')
    expect(result.letterCount).toBe(4)
  })

  it('should handle text with spaces', () => {
    const result = calculateGematria('שלום עולם')
    expect(result.letterCount).toBe(8)
  })
})

// =============================================================================
// NAME ANALYSIS TESTS
// =============================================================================

describe('Name Analysis', () => {
  it('should analyze first name only', () => {
    const result = analyzeNameGematria('אברהם')
    expect(result.firstName).toBe('אברהם')
    expect(result.lastName).toBeNull()
    expect(result.fatherName).toBeNull()
    expect(result.analysis).toBeDefined()
  })

  it('should analyze full name with last name', () => {
    const result = analyzeNameGematria('אברהם', 'כהן')
    expect(result.firstName).toBe('אברהם')
    expect(result.lastName).toBe('כהן')
    expect(result.fullName).toBe('אברהם כהן')
    expect(result.firstNameAnalysis).toBeDefined()
    expect(result.lastNameAnalysis).toBeDefined()
  })

  it('should analyze full name with father name', () => {
    const result = analyzeNameGematria('יצחק', 'לוי', 'אברהם')
    expect(result.fatherName).toBe('אברהם')
    expect(result.fatherNameAnalysis).toBeDefined()
  })
})

// =============================================================================
// NAME COMPARISON TESTS
// =============================================================================

describe('Name Comparison', () => {
  it('should compare two names', () => {
    const result = compareNames('אהבה', 'אחד')
    expect(result.name1).toBe('אהבה')
    expect(result.name2).toBe('אחד')
    expect(result.value1).toBe(13) // אהבה = 13
    expect(result.value2).toBe(13) // אחד = 1+8+4 = 13
  })

  it('should calculate combined value', () => {
    const result = compareNames('אב', 'אם')
    expect(result.combinedValue).toBe(result.value1 + result.value2)
  })

  it('should detect shared digital root', () => {
    // Same digital root
    const result1 = compareNames('אהבה', 'אחד') // Both = 13, root = 4
    expect(result1.sharedDigitalRoot).toBe(true)

    // Different digital root
    const result2 = compareNames('אב', 'גד') // 3 vs 7
    expect(result2.sharedDigitalRoot).toBe(false)
  })
})

// =============================================================================
// GROUP ANALYSIS TESTS
// =============================================================================

describe('Group Analysis', () => {
  it('should analyze group of names', () => {
    const names = ['אברהם', 'יצחק', 'יעקב']
    const result = analyzeGroup(names)

    expect(result.names).toEqual(names)
    expect(result.values).toHaveLength(3)
    expect(result.totalValue).toBe(result.values.reduce((a, b) => a + b, 0))
  })

  it('should calculate average value', () => {
    const names = ['אב', 'גד'] // 3 and 7
    const result = analyzeGroup(names)
    expect(result.averageValue).toBe(5) // (3 + 7) / 2 = 5
  })

  it('should find matching pairs', () => {
    const names = ['אהבה', 'אחד', 'יהוה'] // 13, 13, 26
    const result = analyzeGroup(names)

    // אהבה and אחד both equal 13
    const exactMatch = result.matchingPairs.find(
      p => (p.name1 === 'אהבה' && p.name2 === 'אחד') ||
           (p.name1 === 'אחד' && p.name2 === 'אהבה')
    )
    expect(exactMatch).toBeDefined()
  })
})

// =============================================================================
// NOTABLE NUMBERS TESTS
// =============================================================================

describe('Notable Numbers', () => {
  it('should find meaning for known values', () => {
    const meanings = findEquivalentMeanings(18)
    expect(meanings.length).toBeGreaterThan(0)
    expect(meanings[0]).toContain('Life') // Chai
  })

  it('should return empty for unknown values', () => {
    const meanings = findEquivalentMeanings(12345)
    expect(meanings).toHaveLength(0)
  })

  it('should detect notable values', () => {
    expect(hasNotableMeaning(26)).toBe(true)  // YHVH
    expect(hasNotableMeaning(358)).toBe(true) // Mashiach
    expect(hasNotableMeaning(12345)).toBe(false)
  })
})

// =============================================================================
// LETTER BREAKDOWN TESTS
// =============================================================================

describe('Letter Breakdown', () => {
  it('should return detailed breakdown', () => {
    const breakdown = getLetterBreakdown('אב')
    expect(breakdown).toHaveLength(2)
    expect(breakdown[0]).toMatchObject({
      letter: 'א',
      name: 'Aleph',
      value: 1,
      isFinal: false,
    })
  })

  it('should identify final forms', () => {
    const breakdown = getLetterBreakdown('אדם')
    const finalMem = breakdown.find(b => b.letter === 'ם')
    expect(finalMem?.isFinal).toBe(true)
  })
})

// =============================================================================
// LETTER COUNTING TESTS
// =============================================================================

describe('Letter Counting', () => {
  it('should count letter occurrences', () => {
    const counts = countLetters('אבאב')
    expect(counts.get('א')).toBe(2)
    expect(counts.get('ב')).toBe(2)
  })

  it('should handle unique letters', () => {
    const counts = countLetters('אבג')
    expect(counts.get('א')).toBe(1)
    expect(counts.get('ב')).toBe(1)
    expect(counts.get('ג')).toBe(1)
  })
})

// =============================================================================
// SUMMARY TESTS
// =============================================================================

describe('Gematria Summary', () => {
  it('should extract summary values', () => {
    const result = calculateGematria('שלום')
    const summary = getGematriaSummary(result)

    expect(summary.standardValue).toBe(result.methods.standard.value)
    expect(summary.ordinalValue).toBe(result.methods.ordinal.value)
    expect(summary.smallValue).toBe(result.methods.small.value)
    expect(summary.digitalRoot).toBe(result.methods.standard.digitalRoot)
    expect(summary.letterCount).toBe(result.letterCount)
  })
})

// =============================================================================
// CIPHER HELPER TESTS
// =============================================================================

describe('Cipher Helpers', () => {
  describe('Avgad Letter', () => {
    it('should return next letter', () => {
      const next = getAvgadLetter('aleph')
      expect(next.id).toBe('bet')
    })

    it('should wrap Tav to Aleph', () => {
      const next = getAvgadLetter('tav')
      expect(next.id).toBe('aleph')
    })
  })

  describe('Albam Pairs', () => {
    it('should map first half to second half', () => {
      const pair = getAlbamPair('aleph')
      expect(pair.id).toBe('lamed') // 1 -> 12
    })

    it('should map second half to first half', () => {
      const pair = getAlbamPair('lamed')
      expect(pair.id).toBe('aleph') // 12 -> 1
    })

    it('should be symmetric', () => {
      HEBREW_LETTERS.forEach(letter => {
        const pair = getAlbamPair(letter.id)
        const pairOfPair = getAlbamPair(pair.id)
        expect(pairOfPair.id).toBe(letter.id)
      })
    })
  })
})

// =============================================================================
// EDGE CASES
// =============================================================================

describe('Edge Cases', () => {
  it('should handle empty string', () => {
    const result = calculateGematria('')
    expect(result.letterCount).toBe(0)
    expect(result.methods.standard.value).toBe(0)
  })

  it('should handle non-Hebrew text', () => {
    const result = calculateGematria('abc123')
    expect(result.letterCount).toBe(0)
    expect(result.methods.standard.value).toBe(0)
  })

  it('should handle mixed text', () => {
    const result = calculateGematria('אב123גד')
    expect(result.letterCount).toBe(4)
    expect(result.methods.standard.value).toBe(10) // א(1)+ב(2)+ג(3)+ד(4)=10
  })

  it('should handle all final forms', () => {
    const finals = 'ךםןףץ'
    const result = calculateGematria(finals)
    expect(result.letterCount).toBe(5)

    // Standard: 20+40+50+80+90 = 280
    expect(result.methods.standard.value).toBe(280)

    // Full: 500+600+700+800+900 = 3500
    expect(result.methods.full.value).toBe(3500)
  })
})
