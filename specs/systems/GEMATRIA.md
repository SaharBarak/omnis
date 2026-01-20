# Gematria System Specification

## Overview

Gematria is a Hebrew alphanumeric code assigning numerical values to letters, words, and phrases. Omnis uses gematria to find numerical correlations between names and discover meaningful connections.

---

## Core Concepts

### Hebrew Letter Values

```typescript
interface HebrewLetter {
  letter: string;
  name: string;
  value: number;
  finalForm?: string;      // Final letter form (if applicable)
  finalValue?: number;     // Value of final form
  transliteration: string;
}

const hebrewAlphabet: HebrewLetter[] = [
  { letter: 'א', name: 'Aleph', value: 1, transliteration: 'A' },
  { letter: 'ב', name: 'Bet', value: 2, transliteration: 'B/V' },
  { letter: 'ג', name: 'Gimel', value: 3, transliteration: 'G' },
  { letter: 'ד', name: 'Dalet', value: 4, transliteration: 'D' },
  { letter: 'ה', name: 'He', value: 5, transliteration: 'H' },
  { letter: 'ו', name: 'Vav', value: 6, transliteration: 'V/O/U' },
  { letter: 'ז', name: 'Zayin', value: 7, transliteration: 'Z' },
  { letter: 'ח', name: 'Chet', value: 8, transliteration: 'Ch' },
  { letter: 'ט', name: 'Tet', value: 9, transliteration: 'T' },
  { letter: 'י', name: 'Yod', value: 10, transliteration: 'Y/I' },
  { letter: 'כ', name: 'Kaf', value: 20, finalForm: 'ך', finalValue: 500, transliteration: 'K/Kh' },
  { letter: 'ל', name: 'Lamed', value: 30, transliteration: 'L' },
  { letter: 'מ', name: 'Mem', value: 40, finalForm: 'ם', finalValue: 600, transliteration: 'M' },
  { letter: 'נ', name: 'Nun', value: 50, finalForm: 'ן', finalValue: 700, transliteration: 'N' },
  { letter: 'ס', name: 'Samekh', value: 60, transliteration: 'S' },
  { letter: 'ע', name: 'Ayin', value: 70, transliteration: 'A/E' },
  { letter: 'פ', name: 'Pe', value: 80, finalForm: 'ף', finalValue: 800, transliteration: 'P/F' },
  { letter: 'צ', name: 'Tsadi', value: 90, finalForm: 'ץ', finalValue: 900, transliteration: 'Ts' },
  { letter: 'ק', name: 'Qof', value: 100, transliteration: 'Q/K' },
  { letter: 'ר', name: 'Resh', value: 200, transliteration: 'R' },
  { letter: 'ש', name: 'Shin', value: 300, transliteration: 'Sh/S' },
  { letter: 'ת', name: 'Tav', value: 400, transliteration: 'T' },
];
```

### Letter Value Lookup
```typescript
const letterValues: Record<string, number> = {
  'א': 1, 'ב': 2, 'ג': 3, 'ד': 4, 'ה': 5,
  'ו': 6, 'ז': 7, 'ח': 8, 'ט': 9, 'י': 10,
  'כ': 20, 'ך': 20, // or 500 in final form method
  'ל': 30,
  'מ': 40, 'ם': 40, // or 600
  'נ': 50, 'ן': 50, // or 700
  'ס': 60, 'ע': 70,
  'פ': 80, 'ף': 80, // or 800
  'צ': 90, 'ץ': 90, // or 900
  'ק': 100, 'ר': 200, 'ש': 300, 'ת': 400,
};
```

---

## Calculation Methods

### Standard Gematria (Mispar Hechrachi)
Regular value assignment.

```typescript
function standardGematria(text: string): number {
  return [...text]
    .filter(char => letterValues[char] !== undefined)
    .reduce((sum, char) => sum + letterValues[char], 0);
}

// Example: שלום = 300 + 30 + 6 + 40 = 376
```

### Full Value Gematria (Mispar Gadol)
Final letters have higher values (500-900).

```typescript
const finalLetterValues: Record<string, number> = {
  'ך': 500, 'ם': 600, 'ן': 700, 'ף': 800, 'ץ': 900,
};

function fullGematria(text: string): number {
  return [...text]
    .filter(char => letterValues[char] !== undefined || finalLetterValues[char] !== undefined)
    .reduce((sum, char) => sum + (finalLetterValues[char] || letterValues[char]), 0);
}
```

### Small Gematria (Mispar Katan)
Reduce each letter to single digit (1-9).

```typescript
function smallGematria(text: string): number {
  return [...text]
    .filter(char => letterValues[char] !== undefined)
    .reduce((sum, char) => {
      let value = letterValues[char];
      while (value >= 10) {
        value = [...String(value)].reduce((s, d) => s + parseInt(d), 0);
      }
      return sum + value;
    }, 0);
}
```

### Ordinal Gematria (Mispar Siduri)
Position in alphabet (1-22).

```typescript
const letterPositions: Record<string, number> = {
  'א': 1, 'ב': 2, 'ג': 3, 'ד': 4, 'ה': 5,
  'ו': 6, 'ז': 7, 'ח': 8, 'ט': 9, 'י': 10,
  'כ': 11, 'ך': 11, 'ל': 12, 'מ': 13, 'ם': 13,
  'נ': 14, 'ן': 14, 'ס': 15, 'ע': 16, 'פ': 17,
  'ף': 17, 'צ': 18, 'ץ': 18, 'ק': 19, 'ר': 20,
  'ש': 21, 'ת': 22,
};

function ordinalGematria(text: string): number {
  return [...text]
    .filter(char => letterPositions[char] !== undefined)
    .reduce((sum, char) => sum + letterPositions[char], 0);
}
```

### AtBash (Reversal Cipher)
Each letter is replaced by its mirror in the alphabet.

```typescript
const atbashMap: Record<string, string> = {
  'א': 'ת', 'ב': 'ש', 'ג': 'ר', 'ד': 'ק', 'ה': 'צ',
  'ו': 'פ', 'ז': 'ע', 'ח': 'ס', 'ט': 'נ', 'י': 'מ',
  'כ': 'ל', 'ל': 'כ', 'מ': 'י', 'נ': 'ט', 'ס': 'ח',
  'ע': 'ז', 'פ': 'ו', 'צ': 'ה', 'ק': 'ד', 'ר': 'ג',
  'ש': 'ב', 'ת': 'א',
};

function atbash(text: string): string {
  return [...text]
    .map(char => atbashMap[char] || char)
    .join('');
}

function atbashGematria(text: string): number {
  return standardGematria(atbash(text));
}
```

### All Methods Summary
```typescript
type GematriaMethod =
  | 'standard'    // Mispar Hechrachi
  | 'full'        // Mispar Gadol (final letters = 500-900)
  | 'small'       // Mispar Katan (reduce to single digits)
  | 'ordinal'     // Mispar Siduri (position 1-22)
  | 'atbash'      // Reversal cipher
  | 'avgad'       // Next letter cipher
  | 'albam';      // Half-alphabet cipher

interface GematriaResult {
  text: string;
  method: GematriaMethod;
  value: number;
  breakdown: Array<{ letter: string; value: number }>;
}

function calculateGematria(text: string, method: GematriaMethod): GematriaResult {
  const calculators: Record<GematriaMethod, (t: string) => number> = {
    standard: standardGematria,
    full: fullGematria,
    small: smallGematria,
    ordinal: ordinalGematria,
    atbash: atbashGematria,
    avgad: avgadGematria,
    albam: albamGematria,
  };

  const breakdown = [...text]
    .filter(char => letterValues[char] !== undefined)
    .map(letter => ({ letter, value: letterValues[letter] }));

  return {
    text,
    method,
    value: calculators[method](text),
    breakdown,
  };
}
```

---

## Name Analysis

### Full Name Breakdown
```typescript
interface NameGematria {
  fullName: string;
  firstName: GematriaResult;
  lastName?: GematriaResult;
  fatherName?: GematriaResult;   // ben/bat [father]
  fullValue: number;
  reducedValue: number;          // Digital root
  methods: Record<GematriaMethod, number>;
}

function analyzeNameGematria(
  firstName: string,
  lastName?: string,
  fatherName?: string
): NameGematria {
  const firstResult = calculateGematria(firstName, 'standard');
  const lastResult = lastName ? calculateGematria(lastName, 'standard') : undefined;
  const fatherResult = fatherName ? calculateGematria(fatherName, 'standard') : undefined;

  const fullName = [firstName, lastName].filter(Boolean).join(' ');
  const fullValue = firstResult.value + (lastResult?.value || 0);

  return {
    fullName,
    firstName: firstResult,
    lastName: lastResult,
    fatherName: fatherResult,
    fullValue,
    reducedValue: digitalRoot(fullValue),
    methods: {
      standard: standardGematria(fullName),
      full: fullGematria(fullName),
      small: smallGematria(fullName),
      ordinal: ordinalGematria(fullName),
      atbash: atbashGematria(fullName),
      avgad: avgadGematria(fullName),
      albam: albamGematria(fullName),
    },
  };
}

function digitalRoot(n: number): number {
  while (n >= 10) {
    n = [...String(n)].reduce((sum, d) => sum + parseInt(d), 0);
  }
  return n;
}
```

---

## Equivalence Finding

### Find Words with Same Value
```typescript
interface GematriaMatch {
  word: string;
  value: number;
  category: string;       // 'name', 'biblical', 'concept', etc.
  source?: string;        // Source text reference
}

// Pre-computed database of known values
const gematriaDatabase: Map<number, GematriaMatch[]> = new Map();

function findEquivalents(value: number): GematriaMatch[] {
  return gematriaDatabase.get(value) || [];
}

function findEquivalentWords(text: string, method: GematriaMethod = 'standard'): GematriaMatch[] {
  const value = calculateGematria(text, method).value;
  return findEquivalents(value);
}
```

### Notable Numbers
```typescript
const notableNumbers: Record<number, { meaning: string; examples: string[] }> = {
  1: { meaning: 'Unity, God', examples: ['אחד (echad)'] },
  7: { meaning: 'Completion, perfection', examples: [''] },
  13: { meaning: 'Love, one', examples: ['אהבה (ahava)', 'אחד (echad)'] },
  18: { meaning: 'Life', examples: ['חי (chai)'] },
  26: { meaning: 'YHVH', examples: ['יהוה'] },
  36: { meaning: 'Double life', examples: ['2 × חי'] },
  72: { meaning: 'Divine names', examples: ['חסד (chesed)'] },
  137: { meaning: 'Kabbalah', examples: ['קבלה'] },
  358: { meaning: 'Messiah/Serpent', examples: ['משיח', 'נחש'] },
  541: { meaning: 'Israel', examples: ['ישראל'] },
  // ... more notable values
};
```

---

## Transliteration

### English to Hebrew
```typescript
const transliterationRules: Array<{ pattern: RegExp; replacement: string }> = [
  { pattern: /sh/gi, replacement: 'ש' },
  { pattern: /ch/gi, replacement: 'ח' },
  { pattern: /tz|ts/gi, replacement: 'צ' },
  { pattern: /th/gi, replacement: 'ת' },
  { pattern: /kh/gi, replacement: 'כ' },
  { pattern: /a/gi, replacement: 'א' },
  { pattern: /b/gi, replacement: 'ב' },
  { pattern: /g/gi, replacement: 'ג' },
  { pattern: /d/gi, replacement: 'ד' },
  { pattern: /h/gi, replacement: 'ה' },
  { pattern: /v|w/gi, replacement: 'ו' },
  { pattern: /z/gi, replacement: 'ז' },
  { pattern: /t/gi, replacement: 'ט' },
  { pattern: /y|i/gi, replacement: 'י' },
  { pattern: /k|c/gi, replacement: 'כ' },
  { pattern: /l/gi, replacement: 'ל' },
  { pattern: /m/gi, replacement: 'מ' },
  { pattern: /n/gi, replacement: 'נ' },
  { pattern: /s/gi, replacement: 'ס' },
  { pattern: /e/gi, replacement: 'ע' },
  { pattern: /p|f/gi, replacement: 'פ' },
  { pattern: /q/gi, replacement: 'ק' },
  { pattern: /r/gi, replacement: 'ר' },
  { pattern: /o|u/gi, replacement: 'ו' },
];

function transliterateToHebrew(english: string): string {
  let result = english.toLowerCase();
  for (const rule of transliterationRules) {
    result = result.replace(rule.pattern, rule.replacement);
  }
  return result;
}

// Note: Transliteration is approximate. User should verify/correct.
```

### Multiple Spelling Variants
Names can have multiple Hebrew spellings:

```typescript
interface NameVariants {
  english: string;
  variants: Array<{
    hebrew: string;
    value: number;
    common: boolean;
  }>;
}

const nameVariants: NameVariants[] = [
  {
    english: 'David',
    variants: [
      { hebrew: 'דוד', value: 14, common: true },
      { hebrew: 'דויד', value: 24, common: false },
    ],
  },
  {
    english: 'Sarah',
    variants: [
      { hebrew: 'שרה', value: 505, common: true },
      { hebrew: 'שרי', value: 510, common: false },
    ],
  },
  // ... more names
];
```

---

## Relationship Analysis

### Compare Two Names
```typescript
interface NameComparison {
  name1: NameGematria;
  name2: NameGematria;

  exactMatch: boolean;            // Same value
  differenceStandard: number;
  differenceSmall: number;

  sharedFactors: number[];        // Common prime factors
  relationship?: string;          // Interpretation

  combinedValue: number;
  combinedReduced: number;
}

function compareNames(name1: string, name2: string): NameComparison {
  const g1 = analyzeNameGematria(name1);
  const g2 = analyzeNameGematria(name2);

  return {
    name1: g1,
    name2: g2,
    exactMatch: g1.fullValue === g2.fullValue,
    differenceStandard: Math.abs(g1.fullValue - g2.fullValue),
    differenceSmall: Math.abs(g1.reducedValue - g2.reducedValue),
    sharedFactors: findSharedPrimeFactors(g1.fullValue, g2.fullValue),
    combinedValue: g1.fullValue + g2.fullValue,
    combinedReduced: digitalRoot(g1.fullValue + g2.fullValue),
  };
}
```

### Group Analysis
```typescript
interface GroupGematria {
  names: NameGematria[];
  totalValue: number;
  averageValue: number;
  matchingPairs: Array<[string, string, number]>;  // Names with same value
  commonDigitalRoot: number | null;
}

function analyzeGroup(names: string[]): GroupGematria {
  const gematrias = names.map(n => analyzeNameGematria(n));

  // Find matching pairs
  const pairs: Array<[string, string, number]> = [];
  for (let i = 0; i < gematrias.length; i++) {
    for (let j = i + 1; j < gematrias.length; j++) {
      if (gematrias[i].fullValue === gematrias[j].fullValue) {
        pairs.push([names[i], names[j], gematrias[i].fullValue]);
      }
    }
  }

  const totalValue = gematrias.reduce((sum, g) => sum + g.fullValue, 0);

  return {
    names: gematrias,
    totalValue,
    averageValue: totalValue / names.length,
    matchingPairs: pairs,
    commonDigitalRoot: findCommonRoot(gematrias.map(g => g.reducedValue)),
  };
}
```

---

## Data Storage

### Name Entry
```typescript
interface PersonGematria {
  personId: PersonId;
  hebrewName: string;
  hebrewNameAlternatives: string[];   // Other spellings
  preferredSpelling: string;

  values: Record<GematriaMethod, number>;
  equivalents: GematriaMatch[];

  notes?: string;
}
```

### Gematria Database Entry
```typescript
interface GematriaDatabaseEntry {
  hebrew: string;
  value: number;
  category: GematriaCategory;
  source: string;
  meaning?: string;
}

type GematriaCategory =
  | 'name'           // Personal names
  | 'biblical'       // Biblical words/phrases
  | 'kabbalistic'    // Kabbalistic terms
  | 'concept'        // Abstract concepts
  | 'phrase'         // Common phrases
  | 'divine-name';   // Names of God
```

---

## Display Components

### Name Analysis Card
```
┌─────────────────────────────────────────┐
│           ליאור                          │
│           LIOR                          │
├─────────────────────────────────────────┤
│  Standard:  ל(30) + י(10) + א(1) +      │
│             ו(6) + ר(200) = 247         │
│                                         │
│  Ordinal:   12 + 10 + 1 + 6 + 20 = 49  │
│  Small:     3 + 1 + 1 + 6 + 2 = 13     │
│  Digital Root: 4                        │
├─────────────────────────────────────────┤
│  Equivalent Words (247):                │
│  • רמז (remez - hint)                   │
│  • זמר (zemer - song)                   │
│  • מראה (mar'eh - vision)               │
└─────────────────────────────────────────┘
```

### Comparison View
```
┌─────────────────────────────────────────┐
│    ליאור (247)  ←→  מיכל (100)         │
├─────────────────────────────────────────┤
│  Combined: 347                          │
│  Difference: 147                        │
│                                         │
│  347 = "שמע" (hear)                     │
│  Shared root: 4 + 1 = 5                │
└─────────────────────────────────────────┘
```

---

## Validation Rules

1. **Hebrew Input**: Must be valid Hebrew characters
2. **No Vowel Points**: Strip nikud (vowel marks) before calculation
3. **Spaces**: Ignored in calculation
4. **Punctuation**: Ignored
5. **Numbers**: Converted or ignored based on context

```typescript
function cleanHebrewText(text: string): string {
  return text
    // Remove nikud (vowel points)
    .replace(/[\u0591-\u05C7]/g, '')
    // Remove non-Hebrew characters except spaces
    .replace(/[^\u05D0-\u05EA\s]/g, '')
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    .trim();
}
```

---

## Test Cases

```typescript
const testCases = [
  { hebrew: 'שלום', standard: 376, ordinal: 61, small: 7 },
  { hebrew: 'אהבה', standard: 13, ordinal: 13, small: 4 },
  { hebrew: 'חי', standard: 18, ordinal: 18, small: 9 },
  { hebrew: 'יהוה', standard: 26, ordinal: 26, small: 8 },
  { hebrew: 'ישראל', standard: 541, ordinal: 64, small: 1 },
  { hebrew: 'תורה', standard: 611, ordinal: 55, small: 8 },
];
```
