# Tzolkin System Specification

## Overview

The Tzolkin is the traditional 260-day Mesoamerican sacred calendar. Unlike the Dreamspell, it follows an unbroken count from ancient times using the GMT (Goodman-Martinez-Thompson) correlation.

---

## Core Concepts

### Day Count
- 260-day cycle (13 × 20)
- Continuous count, no leap day adjustment
- Each day has a Tone (1-13) and Day Sign (1-20)

### Day Signs (Nawales)
20 sacred day signs in the traditional Mayan count.

| # | Mayan | Yucatec | English | Hebrew |
|---|-------|---------|---------|--------|
| 1 | Imix | Imix' | Crocodile/Dragon | תנין |
| 2 | Ik' | Ik' | Wind | רוח |
| 3 | Ak'b'al | Ak'bal | Night/House | לילה |
| 4 | K'an | K'an | Corn/Seed | תירס |
| 5 | Chikchan | Chicchan | Serpent | נחש |
| 6 | Kimi | Cimi | Death | מוות |
| 7 | Manik' | Manik | Deer/Hand | צבי |
| 8 | Lamat | Lamat | Rabbit/Star | ארנב |
| 9 | Muluk | Muluc | Water/Moon | מים |
| 10 | Ok | Oc | Dog | כלב |
| 11 | Chuwen | Chuen | Monkey | קוף |
| 12 | Eb' | Eb | Road/Grass | דרך |
| 13 | B'en | Ben | Reed/Corn | קנה |
| 14 | Ix | Ix | Jaguar | יגואר |
| 15 | Men | Men | Eagle | נשר |
| 16 | K'ib' | Cib | Owl/Vulture | ינשוף |
| 17 | Kab'an | Caban | Earth | אדמה |
| 18 | Etz'nab' | Etznab | Flint/Mirror | צור |
| 19 | Kawak | Cauac | Storm/Rain | גשם |
| 20 | Ajpu | Ahau | Lord/Sun | אדון |

### Tones (Numbers)
13 numbers cycle with the 20 day signs.

| # | K'iche' | Meaning |
|---|---------|---------|
| 1 | Jun | Beginning, unity |
| 2 | Kieb' | Duality, decision |
| 3 | Oxib' | Action, movement |
| 4 | Kajib' | Stability, foundation |
| 5 | Job' | Empowerment |
| 6 | Waqib' | Flow, receptivity |
| 7 | Wuqub' | Reflection, center |
| 8 | Wajxaqib' | Justice, harmony |
| 9 | B'elejeb' | Patience, cycles |
| 10 | Lajuj | Manifestation |
| 11 | Junlajuj | Change, resolution |
| 12 | Kab'lajuj | Understanding |
| 13 | Oxlajuj | Completion, transformation |

---

## Calculation Algorithm

### GMT Correlation Constant
```typescript
const GMT_CORRELATION = 584283;
```

This is the most widely accepted correlation between the Mayan Long Count and the Julian Day Number.

### Julian Day Number
```typescript
function gregorianToJDN(year: number, month: number, day: number): number {
  // Convert Gregorian date to Julian Day Number
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;

  return (
    day +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045
  );
}
```

### Tzolkin Day Calculation
```typescript
interface TzolkinDay {
  tone: number;      // 1-13
  daySign: number;   // 1-20
  dayName: string;   // e.g., "4 Ajpu"
}

function calculateTzolkin(date: Date): TzolkinDay {
  const jdn = gregorianToJDN(
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate()
  );

  // Calculate tone and day sign
  const tone = ((jdn + 5) % 13) + 1;
  const daySign = ((jdn + 19) % 20) + 1;

  return {
    tone,
    daySign,
    dayName: `${tone} ${daySignNames[daySign]}`,
  };
}
```

### Alternative Calculation (Direct from JDN)
```typescript
function tzolkinFromJDN(jdn: number): TzolkinDay {
  // Tzolkin day count from known anchor point
  // Aug 11, 3114 BCE (JDN 584283) = 4 Ajpu

  const daysSinceEpoch = jdn - GMT_CORRELATION;

  // Tone cycles every 13 days, starting at 4 on epoch
  const tone = ((daysSinceEpoch + 3) % 13) + 1;

  // Day sign cycles every 20 days, starting at 20 (Ajpu) on epoch
  const daySign = ((daysSinceEpoch + 19) % 20) + 1;

  return { tone, daySign, dayName: `${tone} ${daySignNames[daySign]}` };
}
```

---

## Key Differences from Dreamspell

| Aspect | Tzolkin | Dreamspell |
|--------|---------|------------|
| Origin | Ancient Mayan | 1987 (José Argüelles) |
| Leap Days | Counts normally | Skips Feb 29 |
| Correlation | GMT (584283) | July 26, 1987 epoch |
| Day Signs | Traditional names | Modified names |
| Purpose | Divination, ritual | Synchronicity, meditation |

### Same Person, Different Days
A person born on the same Gregorian date will have **different** Tzolkin and Dreamspell signatures. Both are shown in Omnis.

---

## Day Sign Qualities

### Detailed Day Sign Data
```typescript
interface DaySignData {
  number: number;
  mayanName: string;
  yucatecName: string;
  englishName: string;
  hebrewName: string;
  element: 'fire' | 'earth' | 'air' | 'water';
  direction: 'east' | 'south' | 'west' | 'north';
  color: 'red' | 'yellow' | 'black' | 'white';
  meaning: string;
  keywords: string[];
  nawal: string;           // Spirit/guardian
  bodyPart: string;
  iconPath: string;
}
```

### Day Sign Directions & Colors
```typescript
const daySignDirections: Record<number, { direction: string; color: string }> = {
  1: { direction: 'east', color: 'red' },
  2: { direction: 'north', color: 'white' },
  3: { direction: 'west', color: 'black' },
  4: { direction: 'south', color: 'yellow' },
  5: { direction: 'east', color: 'red' },
  // ... cycles every 4
};
```

---

## Year Bearer System

### Mayan Year (Haab')
365-day solar year with 18 months of 20 days + 5 "unlucky" days (Wayeb').

### Year Bearer
The Tzolkin day on which the Haab' year begins. Only 4 day signs can be year bearers:

```typescript
type YearBearer = 'Ik' | 'Manik' | 'Eb' | 'Caban';

function getYearBearer(year: number): { daySign: YearBearer; tone: number } {
  // Year bearer calculation based on Haab' new year
  // Typically falls on July 26 (Gregorian)
  const haabNewYear = new Date(year, 6, 26);
  const tzolkin = calculateTzolkin(haabNewYear);

  return {
    daySign: daySignNames[tzolkin.daySign] as YearBearer,
    tone: tzolkin.tone,
  };
}
```

---

## Trecena (13-Day Period)

### Trecena Structure
```typescript
interface Trecena {
  startDate: Date;
  startSign: number;
  name: string;              // Named by first day sign
  days: TzolkinDay[];
  ruler: string;             // Deity/nawal of trecena
}

function getTrecena(date: Date): Trecena {
  const tzolkin = calculateTzolkin(date);

  // Find start of current trecena
  const daysIntoTrecena = tzolkin.tone - 1;
  const startDate = new Date(date);
  startDate.setDate(startDate.getDate() - daysIntoTrecena);

  const startTzolkin = calculateTzolkin(startDate);

  const days: TzolkinDay[] = [];
  for (let i = 0; i < 13; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    days.push(calculateTzolkin(d));
  }

  return {
    startDate,
    startSign: startTzolkin.daySign,
    name: daySignNames[startTzolkin.daySign],
    days,
    ruler: trecenaRulers[startTzolkin.daySign],
  };
}
```

---

## Birth Chart Components

### Conception Sign
Traditional calculation considers the Tzolkin day 260 days before birth.

```typescript
function getConceptionSign(birthDate: Date): TzolkinDay {
  const conceptionDate = new Date(birthDate);
  conceptionDate.setDate(conceptionDate.getDate() - 260);
  return calculateTzolkin(conceptionDate);
}
```

### Destiny Pattern
The 260 days following birth are considered significant.

```typescript
interface DestinyPattern {
  birth: TzolkinDay;
  conception: TzolkinDay;
  firstTrecena: Trecena;
}
```

---

## Divination Context

### Day Sign Meanings for Divination
```typescript
interface DivinationMeaning {
  daySign: number;
  favorable: string[];       // Good activities
  unfavorable: string[];     // Activities to avoid
  offerings: string[];       // Traditional offerings
  prayer: string;            // Traditional prayer
}
```

### Energy Quality
```typescript
type EnergyQuality = 'strong' | 'neutral' | 'challenging';

function getDayEnergy(tone: number, daySign: number): EnergyQuality {
  // Traditional interpretations of day quality
  // Based on K'iche' Maya daykeeper traditions

  const strongDays = [4, 8, 9, 13];
  const challengingDays = [1, 6, 10];

  if (strongDays.includes(tone)) return 'strong';
  if (challengingDays.includes(tone)) return 'challenging';
  return 'neutral';
}
```

---

## Data Structures

### Complete Day Sign
```typescript
const daySignData: DaySignData[] = [
  {
    number: 1,
    mayanName: 'Imix',
    yucatecName: "Imix'",
    englishName: 'Crocodile',
    hebrewName: 'תנין',
    element: 'water',
    direction: 'east',
    color: 'red',
    meaning: 'Primordial waters, origin, nurturing',
    keywords: ['creation', 'beginnings', 'motherhood', 'nurturing'],
    nawal: 'Crocodile spirit',
    bodyPart: 'Breasts',
    iconPath: 'assets/icons/tzolkin/01-imix.svg',
  },
  // ... 19 more
];
```

---

## Icons

### Source
Traditional Mayan glyphs, public domain or properly attributed.

### Format
- SVG with traditional glyph style
- 64x64 base size
- Monochrome primary, color variants

### File Structure
```
assets/
  icons/
    tzolkin/
      01-imix.svg
      02-ik.svg
      ...
    tones/
      01.svg
      02.svg
      ...
```

---

## Validation Rules

1. **Date Range**: Historical dates back to 3114 BCE supported
2. **JDN Calculation**: Must match known anchor points
3. **Tone Range**: 1-13
4. **Day Sign Range**: 1-20

---

## Test Cases

```typescript
const testCases = [
  // Known historical dates
  { date: '2012-12-21', expectedTone: 4, expectedSign: 20 },   // 4 Ajpu (end of 13th b'ak'tun)
  { date: '1987-08-16', expectedTone: 1, expectedSign: 1 },    // 1 Imix (Harmonic Convergence)
  { date: '2000-01-01', expectedTone: 11, expectedSign: 2 },

  // Verify continuous count through leap years
  { date: '2024-02-28', expectedTone: 5, expectedSign: 4 },
  { date: '2024-02-29', expectedTone: 6, expectedSign: 5 },    // Counted normally
  { date: '2024-03-01', expectedTone: 7, expectedSign: 6 },
];
```

---

## Comparison Output

When displaying both systems:
```
┌─────────────────────────────────────────┐
│         ליאור • 23.9.1966               │
├─────────────────────────────────────────┤
│  Dreamspell:    Kin 123                 │
│                 Blue Rhythmic Night     │
│                 לילה קצבי כחול          │
├─────────────────────────────────────────┤
│  Tzolkin:       7 Muluk                 │
│                 7 Moon                  │
│                 7 ירח                   │
└─────────────────────────────────────────┘
```

Note: The same person will have **different** signs in each system. Both are valid within their respective traditions.
