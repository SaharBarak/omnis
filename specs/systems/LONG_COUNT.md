# Long Count System Specification

## Overview

The Mayan Long Count is a non-repeating, vigesimal (base-20) calendar that counts days from a mythological starting point. It provides absolute dating and tracks vast cycles of time.

---

## Core Concepts

### Long Count Notation
Format: **B'ak'tun.K'atun.Tun.Winal.K'in**

Example: `13.0.11.5.12`

### Time Units

| Unit | Days | Calculation |
|------|------|-------------|
| K'in | 1 | Base unit (1 day) |
| Winal | 20 | 20 K'in |
| Tun | 360 | 18 Winal |
| K'atun | 7,200 | 20 Tun |
| B'ak'tun | 144,000 | 20 K'atun |

Note: Winal uses 18 (not 20) to approximate a solar year.

### Higher Cycles (Extended Count)

| Unit | Days | B'ak'tuns |
|------|------|-----------|
| Piktun | 2,880,000 | 20 |
| Kalabtun | 57,600,000 | 400 |
| K'inchiltun | 1,152,000,000 | 8,000 |
| Alautun | 23,040,000,000 | 160,000 |

---

## Calculation Algorithm

### Epoch (Creation Date)
- **August 11, 3114 BCE** (Gregorian, proleptic)
- Long Count: 0.0.0.0.0
- Julian Day Number: 584283 (GMT correlation)

### Gregorian to Long Count
```typescript
interface LongCount {
  baktun: number;
  katun: number;
  tun: number;
  winal: number;
  kin: number;
}

function gregorianToLongCount(date: Date): LongCount {
  const jdn = gregorianToJDN(
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate()
  );

  return jdnToLongCount(jdn);
}

function jdnToLongCount(jdn: number): LongCount {
  const GMT_CORRELATION = 584283;
  let totalDays = jdn - GMT_CORRELATION;

  const baktun = Math.floor(totalDays / 144000);
  totalDays %= 144000;

  const katun = Math.floor(totalDays / 7200);
  totalDays %= 7200;

  const tun = Math.floor(totalDays / 360);
  totalDays %= 360;

  const winal = Math.floor(totalDays / 20);
  const kin = totalDays % 20;

  return { baktun, katun, tun, winal, kin };
}
```

### Long Count to Gregorian
```typescript
function longCountToJDN(lc: LongCount): number {
  const GMT_CORRELATION = 584283;

  const totalDays =
    lc.baktun * 144000 +
    lc.katun * 7200 +
    lc.tun * 360 +
    lc.winal * 20 +
    lc.kin;

  return GMT_CORRELATION + totalDays;
}

function longCountToGregorian(lc: LongCount): Date {
  const jdn = longCountToJDN(lc);
  return jdnToGregorian(jdn);
}

function jdnToGregorian(jdn: number): Date {
  // Algorithm to convert JDN to Gregorian
  const a = jdn + 32044;
  const b = Math.floor((4 * a + 3) / 146097);
  const c = a - Math.floor(146097 * b / 4);
  const d = Math.floor((4 * c + 3) / 1461);
  const e = c - Math.floor(1461 * d / 4);
  const m = Math.floor((5 * e + 2) / 153);

  const day = e - Math.floor((153 * m + 2) / 5) + 1;
  const month = m + 3 - 12 * Math.floor(m / 10);
  const year = 100 * b + d - 4800 + Math.floor(m / 10);

  return new Date(year, month - 1, day);
}
```

### String Formatting
```typescript
function formatLongCount(lc: LongCount): string {
  return `${lc.baktun}.${lc.katun}.${lc.tun}.${lc.winal}.${lc.kin}`;
}

function parseLongCount(str: string): LongCount {
  const parts = str.split('.').map(Number);
  if (parts.length !== 5 || parts.some(isNaN)) {
    throw new Error('Invalid Long Count format');
  }

  return {
    baktun: parts[0],
    katun: parts[1],
    tun: parts[2],
    winal: parts[3],
    kin: parts[4],
  };
}
```

---

## Calendar Round

The Calendar Round combines the Tzolkin (260-day) and Haab' (365-day) cycles, repeating every 52 Haab' years (18,980 days).

### Haab' (Solar Year)
```typescript
interface Haab {
  month: number;      // 0-18 (0-17 regular, 18 = Wayeb')
  day: number;        // 0-19 (or 0-4 for Wayeb')
  monthName: string;
}

const haabMonths = [
  'Pop', 'Wo', 'Sip', 'Sotz', 'Sek',
  'Xul', 'Yaxkin', 'Mol', 'Chen', 'Yax',
  'Sak', 'Keh', 'Mak', 'Kankin', 'Muwan',
  'Pax', 'Kayab', 'Kumku', 'Wayeb'
];

function jdnToHaab(jdn: number): Haab {
  const GMT_CORRELATION = 584283;
  // Haab' on 0.0.0.0.0 was 8 Kumku
  const haabEpoch = 17 * 20 + 8; // Day number in Haab' cycle

  const daysSinceEpoch = jdn - GMT_CORRELATION;
  const haabDay = (daysSinceEpoch + haabEpoch) % 365;

  if (haabDay >= 360) {
    return {
      month: 18,
      day: haabDay - 360,
      monthName: 'Wayeb',
    };
  }

  return {
    month: Math.floor(haabDay / 20),
    day: haabDay % 20,
    monthName: haabMonths[Math.floor(haabDay / 20)],
  };
}
```

### Full Calendar Round
```typescript
interface CalendarRound {
  tzolkin: TzolkinDay;
  haab: Haab;
  formatted: string;    // e.g., "4 Ajpu 8 Kumku"
}

function getCalendarRound(date: Date): CalendarRound {
  const jdn = gregorianToJDN(
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate()
  );

  const tzolkin = tzolkinFromJDN(jdn);
  const haab = jdnToHaab(jdn);

  return {
    tzolkin,
    haab,
    formatted: `${tzolkin.tone} ${daySignNames[tzolkin.daySign]} ${haab.day} ${haab.monthName}`,
  };
}
```

---

## Important Dates

### Historical Anchor Points
```typescript
const anchorDates = [
  {
    gregorian: '2012-12-21',
    longCount: '13.0.0.0.0',
    tzolkin: '4 Ajpu',
    haab: '3 Kankin',
    significance: 'End of 13th B\'ak\'tun cycle',
  },
  {
    gregorian: '1987-08-16',
    longCount: '12.18.14.4.0',
    tzolkin: '1 Imix',
    haab: '9 Mol',
    significance: 'Harmonic Convergence',
  },
  {
    gregorian: '-3113-08-11', // 3114 BCE
    longCount: '0.0.0.0.0',
    tzolkin: '4 Ajpu',
    haab: '8 Kumku',
    significance: 'Creation date / Epoch',
  },
];
```

### Personal Key Dates
```typescript
interface PersonalDates {
  birth: {
    gregorian: Date;
    longCount: LongCount;
    calendarRound: CalendarRound;
  };
  katunBirthdays: Date[];      // Every 7,200 days (~19.7 years)
  tunBirthdays: Date[];        // Every 360 days
  nextCalendarRoundReturn: Date; // Same CR as birth (~52 years)
}

function calculatePersonalDates(birthDate: Date): PersonalDates {
  const birthJDN = gregorianToJDN(
    birthDate.getFullYear(),
    birthDate.getMonth() + 1,
    birthDate.getDate()
  );

  const katunBirthdays: Date[] = [];
  const tunBirthdays: Date[] = [];

  // Calculate tun birthdays (next 10)
  for (let i = 1; i <= 10; i++) {
    const tunJDN = birthJDN + (i * 360);
    if (tunJDN > Date.now() / 86400000 + 2440588) { // Future only
      tunBirthdays.push(jdnToGregorian(tunJDN));
    }
  }

  // Calculate katun birthdays (next 5)
  for (let i = 1; i <= 5; i++) {
    const katunJDN = birthJDN + (i * 7200);
    katunBirthdays.push(jdnToGregorian(katunJDN));
  }

  // Calendar Round return (52 Haab' years = 18,980 days)
  const crReturnJDN = birthJDN + 18980;

  return {
    birth: {
      gregorian: birthDate,
      longCount: jdnToLongCount(birthJDN),
      calendarRound: getCalendarRound(birthDate),
    },
    katunBirthdays,
    tunBirthdays,
    nextCalendarRoundReturn: jdnToGregorian(crReturnJDN),
  };
}
```

---

## Cycle Meanings

### B'ak'tun Cycles
```typescript
interface BaktunCycle {
  number: number;
  startDate: Date;
  endDate: Date;
  theme: string;
  description: string;
}

const baktunCycles: BaktunCycle[] = [
  { number: 12, theme: 'Transformation', /* ... */ },
  { number: 13, theme: 'New Beginning', /* started 2012-12-21 */ },
  // etc.
];
```

### K'atun Prophecies
Traditional Mayan prophecies associated with K'atun cycles.

```typescript
interface KatunProphecy {
  katunAjpu: number;   // Which Ajpu day begins the K'atun (1-13)
  theme: string;
  characteristics: string[];
}
```

---

## Display Formats

### Long Count Display
```
┌─────────────────────────────────────────┐
│           Long Count Date               │
├─────────────────────────────────────────┤
│                                         │
│          13 . 0 . 11 . 5 . 12          │
│                                         │
│  B'ak'tun  K'atun   Tun   Winal  K'in  │
│     13       0      11      5     12   │
│                                         │
│  Days since creation: 1,872,912        │
│                                         │
├─────────────────────────────────────────┤
│  Calendar Round: 4 Eb 10 Sotz'          │
└─────────────────────────────────────────┘
```

### Timeline View
```
Creation ─────────────────────────────────► Now
0.0.0.0.0                              13.0.11.5.12
    │                                       │
    ├─── B'ak'tun 12 ───┤── B'ak'tun 13 ──┤
                        │
                   2012-12-21
```

---

## Data Structures

```typescript
interface LongCountData {
  longCount: LongCount;
  jdn: number;
  gregorian: Date;
  tzolkin: TzolkinDay;
  haab: Haab;
  calendarRound: string;
  daysSinceCreation: number;
  currentBaktun: number;
  currentKatun: number;
}

function getFullLongCountData(date: Date): LongCountData {
  const jdn = gregorianToJDN(
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate()
  );

  const lc = jdnToLongCount(jdn);
  const tzolkin = tzolkinFromJDN(jdn);
  const haab = jdnToHaab(jdn);

  return {
    longCount: lc,
    jdn,
    gregorian: date,
    tzolkin,
    haab,
    calendarRound: `${tzolkin.tone} ${daySignNames[tzolkin.daySign]} ${haab.day} ${haab.monthName}`,
    daysSinceCreation: jdn - 584283,
    currentBaktun: lc.baktun,
    currentKatun: lc.katun,
  };
}
```

---

## Validation Rules

1. **Long Count Range**: 0.0.0.0.0 to 19.19.19.17.19 (standard range)
2. **Winal Max**: 0-17 (not 0-19 like other positions)
3. **K'in Max**: 0-19
4. **Other positions**: 0-19
5. **JDN Correlation**: GMT 584283 is canonical

---

## Test Cases

```typescript
const testCases = [
  {
    gregorian: '2012-12-21',
    longCount: '13.0.0.0.0',
    tzolkin: { tone: 4, daySign: 20 },
    haab: { month: 14, day: 3 },
  },
  {
    gregorian: '2000-01-01',
    longCount: '12.19.6.15.2',
    tzolkin: { tone: 11, daySign: 2 },
  },
  {
    gregorian: '1966-09-23',
    longCount: '12.17.13.1.16',
  },
];
```
