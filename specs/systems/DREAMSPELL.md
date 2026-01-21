# Dreamspell System Specification

## Overview

The Dreamspell is a modern calendar system created by José Argüelles, based on Mayan concepts but with its own distinct calculations. It assigns each day a Kin (1-260) composed of a Seal (1-20) and Tone (1-13).

---

## Core Concepts

### Kin (Daily Energy)
- Range: 1–260
- Combination of Seal + Tone
- Formula: `kin = ((seal - 1) + ((tone - 1) * 20)) % 260 + 1`

### Seals (Solar Tribes)
20 archetypal energies that cycle through the calendar.

| # | Mayan | English | Hebrew | Color |
|---|-------|---------|--------|-------|
| 1 | Imix | Dragon | דרקון | Red |
| 2 | Ik | Wind | רוח | White |
| 3 | Akbal | Night | לילה | Blue |
| 4 | Kan | Seed | זרע | Yellow |
| 5 | Chicchan | Serpent | נחש | Red |
| 6 | Cimi | Worldbridger | גשר העולמות | White |
| 7 | Manik | Hand | יד | Blue |
| 8 | Lamat | Star | כוכב | Yellow |
| 9 | Muluc | Moon | ירח | Red |
| 10 | Oc | Dog | כלב | White |
| 11 | Chuen | Monkey | קוף | Blue |
| 12 | Eb | Human | אדם | Yellow |
| 13 | Ben | Skywalker | הולך שמיים | Red |
| 14 | Ix | Wizard | קוסם | White |
| 15 | Men | Eagle | נשר | Blue |
| 16 | Cib | Warrior | לוחם | Yellow |
| 17 | Caban | Earth | אדמה | Red |
| 18 | Etznab | Mirror | מראה | White |
| 19 | Cauac | Storm | סערה | Blue |
| 20 | Ahau | Sun | שמש | Yellow |

### Tones (Galactic Tones)
13 tones representing different qualities of expression.

| # | Name | Hebrew | Keyword | Power |
|---|------|--------|---------|-------|
| 1 | Magnetic | מגנטי | Unify | Attraction |
| 2 | Lunar | ירחי | Polarize | Challenge |
| 3 | Electric | חשמלי | Activate | Service |
| 4 | Self-Existing | עצמי | Define | Form |
| 5 | Overtone | על-טונלי | Empower | Radiance |
| 6 | Rhythmic | קצבי | Organize | Balance |
| 7 | Resonant | מהוד | Channel | Attunement |
| 8 | Galactic | גלקטי | Harmonize | Integrity |
| 9 | Solar | שמשי | Pulse | Intention |
| 10 | Planetary | כוכבי | Perfect | Manifestation |
| 11 | Spectral | ספקטרלי | Dissolve | Liberation |
| 12 | Crystal | קריסטלי | Dedicate | Cooperation |
| 13 | Cosmic | קוסמי | Endure | Presence |

### Color Families
```typescript
type ColorFamily = 'red' | 'white' | 'blue' | 'yellow';

const sealColors: Record<number, ColorFamily> = {
  1: 'red', 2: 'white', 3: 'blue', 4: 'yellow',
  5: 'red', 6: 'white', 7: 'blue', 8: 'yellow',
  9: 'red', 10: 'white', 11: 'blue', 12: 'yellow',
  13: 'red', 14: 'white', 15: 'blue', 16: 'yellow',
  17: 'red', 18: 'white', 19: 'blue', 20: 'yellow',
};
```

---

## Calculation Algorithm

### Epoch
- **July 26, 1987** = Kin 34 (White Galactic Wizard)
- This is "Day Out of Time" for the previous year

### Days Since Epoch
```typescript
function daysSinceEpoch(date: Date): number {
  const epoch = new Date(1987, 6, 26); // July 26, 1987
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  // Count days, skipping Feb 29 in leap years
  let days = 0;
  let current = new Date(epoch);

  while (current < target) {
    current.setDate(current.getDate() + 1);

    // Skip February 29 (Dreamspell ignores leap days)
    if (current.getMonth() === 1 && current.getDate() === 29) {
      continue;
    }
    days++;
  }

  return days;
}
```

### Kin Calculation
```typescript
function calculateKin(date: Date): number {
  const EPOCH_KIN = 34;
  const days = daysSinceEpoch(date);
  return ((EPOCH_KIN - 1 + days) % 260) + 1;
}

function kinToSealTone(kin: number): { seal: number; tone: number } {
  const seal = ((kin - 1) % 20) + 1;
  const tone = ((kin - 1) % 13) + 1;
  return { seal, tone };
}
```

### Leap Day Handling
**Critical**: Dreamspell operates on a 365-day year. February 29 is **not counted** — it shares the Kin of February 28.

```typescript
function isLeapDaySkipped(date: Date): boolean {
  return date.getMonth() === 1 && date.getDate() === 29;
}

function adjustedDate(date: Date): Date {
  if (isLeapDaySkipped(date)) {
    // Return Feb 28 instead
    return new Date(date.getFullYear(), 1, 28);
  }
  return date;
}
```

---

## Oracle (Destiny Pattern)

The Oracle shows five related Kins that form a person's energetic pattern.

### Oracle Positions

```
           ┌─────────┐
           │  Guide  │
           │   (G)   │
           └────┬────┘
                │
┌─────────┐ ┌───┴───┐ ┌─────────┐
│Antipode │─│  Kin  │─│ Analog  │
│   (A)   │ │  (K)  │ │  (An)   │
└─────────┘ └───┬───┘ └─────────┘
                │
           ┌────┴────┐
           │ Occult  │
           │   (O)   │
           └─────────┘
```

### Oracle Calculation Rules

#### Analog (Support)
Same color family, adds to 19.
```typescript
function getAnalog(seal: number): number {
  return 19 - seal + (seal <= 10 ? 1 : 1);
  // Simplified: analog pairs sum to 21 or specific mapping
}

const analogPairs: Record<number, number> = {
  1: 17, 2: 14, 3: 11, 4: 8, 5: 9,
  6: 13, 7: 12, 8: 4, 9: 5, 10: 16,
  11: 3, 12: 7, 13: 6, 14: 2, 15: 19,
  16: 10, 17: 1, 18: 20, 19: 15, 20: 18,
};
```

#### Antipode (Challenge)
Opposite color family, 10 seals apart.
```typescript
function getAntipode(seal: number): number {
  return ((seal - 1 + 10) % 20) + 1;
}
```

#### Occult (Hidden Power)
Adds to 21.
```typescript
function getOccult(seal: number): number {
  return 21 - seal;
}
```

#### Guide
Same color family, determined by tone.
```typescript
function getGuide(seal: number, tone: number): number {
  const colorFamily = (seal - 1) % 4; // 0=red, 1=white, 2=blue, 3=yellow
  const guideIndex = [
    [1, 13, 5, 17, 9],   // Red guides
    [2, 14, 6, 18, 10],  // White guides
    [3, 15, 7, 19, 11],  // Blue guides
    [4, 16, 8, 20, 12],  // Yellow guides
  ][colorFamily];

  // Guide position based on tone
  const position = (tone - 1) % 5;
  return guideIndex[position];
}
```

### Full Oracle Calculation
```typescript
interface Oracle {
  kin: number;
  seal: number;
  tone: number;
  guide: number;
  analog: number;
  antipode: number;
  occult: number;
}

function calculateOracle(kin: number): Oracle {
  const { seal, tone } = kinToSealTone(kin);

  return {
    kin,
    seal,
    tone,
    guide: getGuide(seal, tone),
    analog: analogPairs[seal],
    antipode: getAntipode(seal),
    occult: getOccult(seal),
  };
}
```

---

## Wavespell

A 13-day cycle where each day holds a different tone.

### Wavespell Structure
```typescript
interface Wavespell {
  startKin: number;           // First day (Magnetic tone)
  seal: number;               // Seal of the wavespell
  days: WavespellDay[];       // 13 days
}

interface WavespellDay {
  position: number;           // 1-13
  tone: number;               // Same as position
  kin: number;
  purpose: string;            // Tone meaning in wavespell context
}
```

### Wavespell Calculation
```typescript
function getWavespell(kin: number): Wavespell {
  // Find the start of this wavespell (nearest Magnetic tone behind)
  const startKin = Math.floor((kin - 1) / 13) * 13 + 1;
  const seal = ((startKin - 1) % 20) + 1;

  const days: WavespellDay[] = [];
  for (let i = 0; i < 13; i++) {
    days.push({
      position: i + 1,
      tone: i + 1,
      kin: startKin + i,
      purpose: wavespellPurposes[i + 1],
    });
  }

  return { startKin, seal, days };
}

const wavespellPurposes: Record<number, string> = {
  1: 'Purpose',
  2: 'Challenge',
  3: 'Service',
  4: 'Form',
  5: 'Command',
  6: 'Balance',
  7: 'Attunement',
  8: 'Integrity',
  9: 'Intention',
  10: 'Manifestation',
  11: 'Liberation',
  12: 'Cooperation',
  13: 'Presence',
};
```

---

## Castle & Moon Cycles

### Castles (52-day cycles)
```typescript
type Castle = 'red' | 'white' | 'blue' | 'yellow' | 'green';

function getCastle(kin: number): Castle {
  const castleIndex = Math.floor((kin - 1) / 52);
  return ['red', 'white', 'blue', 'yellow', 'green'][castleIndex] as Castle;
}
```

### 13-Moon Calendar
```typescript
interface Moon {
  number: number;             // 1-13
  name: string;
  tone: number;               // Moon's tone
  startDate: Date;            // Gregorian start
  endDate: Date;
}

const moons: Moon[] = [
  { number: 1, name: 'Magnetic', tone: 1, /* July 26 - Aug 22 */ },
  { number: 2, name: 'Lunar', tone: 2, /* Aug 23 - Sep 19 */ },
  // ... etc
];
```

---

## Mantras (Affirmations)

Each Kin has a unique mantra combining Tone + Seal qualities.

### Mantra Template
```
I [tone-action] in order to [seal-action]
[tone-power] [seal-essence]
I seal the [seal-quality] of [seal-domain]
With the [tone-adjective] tone of [tone-name]
I am guided by [guide-description]
```

### Example (Kin 123 - Blue Rhythmic Night)
```
I organize in order to dream
Balancing intuition
I seal the input of abundance
With the rhythmic tone of equality
I am guided by my own power doubled
```

### Hebrew Translation
```
אני מארגן כדי לחלום
מאזן אינטואיציה
אני חותם את הקלט של שפע
עם הטון הקצבי של שוויון
אני מודרך על ידי הכוח שלי עצמו מוכפל
```

---

## Yearly Kin (Galactic Signature)

### Birthday Kin
The Kin on a person's Gregorian birthday each year.

```typescript
function getYearlyKin(birthDate: Date, year: number): number {
  const thisYearBirthday = new Date(year, birthDate.getMonth(), birthDate.getDate());
  return calculateKin(thisYearBirthday);
}
```

### Galactic Return
When your birthday Kin matches your birth Kin (every ~52 years for some, varies).

---

## Data Structures

### Seal Data
```typescript
interface SealData {
  number: number;
  mayanName: string;
  englishName: string;
  hebrewName: string;
  color: ColorFamily;
  action: string;
  essence: string;
  power: string;
  chakra: string;
  direction: 'east' | 'north' | 'west' | 'south';
  iconPath: string;
}
```

### Tone Data
```typescript
interface ToneData {
  number: number;
  name: string;
  hebrewName: string;
  action: string;
  power: string;
  essence: string;
  question: string;
}
```

---

## Icons

### Source
Law of Time official icon set (with permission/attribution).

### Format
- SVG preferred for scalability
- 64x64 base size
- Color variants: full color, monochrome, inverted

### File Structure
```
assets/
  icons/
    seals/
      01-dragon.svg
      02-wind.svg
      ...
    tones/
      01-magnetic.svg
      02-lunar.svg
      ...
```

---

## Validation Rules

1. **Date Range**: 1900-01-01 to 2100-12-31
2. **Leap Day**: Feb 29 returns Feb 28 Kin with flag
3. **Kin Range**: Must be 1-260
4. **Seal Range**: Must be 1-20
5. **Tone Range**: Must be 1-13

---

## Test Cases

```typescript
const testCases = [
  { date: '1987-07-26', expectedKin: 34 },   // Epoch
  { date: '2000-01-01', expectedKin: 153 },
  { date: '2024-02-28', expectedKin: 108 },
  { date: '2024-02-29', expectedKin: 108 },  // Same as Feb 28
  { date: '2024-03-01', expectedKin: 109 },
];
```
