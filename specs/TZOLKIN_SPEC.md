# Traditional Tzolkin Calculation Specification

## Overview

The traditional Mayan Tzolkin is a 260-day sacred calendar that has been in continuous use for thousands of years. It differs from Dreamspell in its correlation to the Gregorian calendar.

---

## Key Difference from Dreamspell

| Aspect | Dreamspell | Traditional Tzolkin |
|--------|------------|---------------------|
| Origin | José Argüelles (1987) | Ancient Maya |
| Leap year | Skips Feb 29 | Counts all days |
| Correlation | July 26 sync | GMT correlation |
| Current use | New Age / Galactic | Guatemala daykeepers |

**The same birth date may give DIFFERENT results in each system.**

---

## Core Concepts

Same 20 seals (day signs) and 13 tones (numbers) as Dreamspell, but:
- Traditional names may vary slightly
- Counting is continuous (no leap day skip)

### Day Signs (Nahuales) — 20 total

| # | Yucatec | K'iche' | English | Hebrew |
|---|---------|---------|---------|--------|
| 1 | Imix | Imox | Crocodile/Dragon | תנין |
| 2 | Ik' | Iq' | Wind | רוח |
| 3 | Ak'b'al | Aq'ab'al | Night/Darkness | לילה |
| 4 | K'an | K'at | Seed/Net | זרע |
| 5 | Chikchan | Kan | Serpent | נחש |
| 6 | Kimi | Kame | Death/Transformer | מוות |
| 7 | Manik' | Kej | Deer/Hand | יד |
| 8 | Lamat | Q'anil | Rabbit/Star | כוכב |
| 9 | Muluk | Toj | Water/Moon | ירח |
| 10 | Ok | Tz'i' | Dog | כלב |
| 11 | Chuwen | B'atz' | Monkey | קוף |
| 12 | Eb' | E | Road/Human | אדם |
| 13 | B'en | Aj | Reed/Corn | קנה |
| 14 | Ix | I'x | Jaguar/Wizard | יגואר |
| 15 | Men | Tz'ikin | Eagle | נשר |
| 16 | Kib' | Ajmaq | Owl/Warrior | לוחם |
| 17 | Kab'an | No'j | Earth/Earthquake | אדמה |
| 18 | Etz'nab' | Tijax | Flint/Mirror | מראה |
| 19 | Kawak | Kawoq | Storm | סערה |
| 20 | Ajaw | Ajpu | Lord/Sun | שמש |

### Tones (Numbers) — 13 total

In traditional Tzolkin, tones are simply numbers 1-13, often written with dot-bar notation:
- Dots = 1
- Bars = 5

| Number | Dot-Bar |
|--------|---------|
| 1 | • |
| 2 | •• |
| 3 | ••• |
| 4 | •••• |
| 5 | — |
| 6 | —• |
| 7 | —•• |
| 8 | —••• |
| 9 | —•••• |
| 10 | == |
| 11 | ==• |
| 12 | ==•• |
| 13 | ==••• |

---

## Calculation: Date → Tzolkin

### GMT Correlation

The most widely accepted correlation is the **GMT (Goodman-Martinez-Thompson) correlation**:
- **Correlation constant:** 584283 (or 584285 in some variants)

This links the Mayan Long Count to the Julian Day Number.

### Algorithm

```
1. Convert Gregorian date to Julian Day Number (JDN)
2. Subtract correlation constant
3. Calculate day sign: (JDN - correlation + day_offset) mod 20
4. Calculate tone: (JDN - correlation + tone_offset) mod 13
```

### Pseudocode

```
function dateToTzolkin(date):
    jdn = gregorianToJulianDay(date)

    // Using GMT 584283 correlation
    // Adjusted so that Aug 11, 3114 BCE = 4 Ahau 8 Kumk'u

    dayNumber = (jdn - 584283 + 16) mod 20  // +16 adjusts to correct day
    toneNumber = (jdn - 584283 + 4) mod 13   // +4 adjusts to correct tone

    if dayNumber == 0: dayNumber = 20
    if toneNumber == 0: toneNumber = 13

    return { day: dayNumber, tone: toneNumber }
```

### Julian Day Number Calculation

```
function gregorianToJulianDay(year, month, day):
    a = floor((14 - month) / 12)
    y = year + 4800 - a
    m = month + 12 * a - 3

    jdn = day + floor((153 * m + 2) / 5) + 365 * y + floor(y / 4) - floor(y / 100) + floor(y / 400) - 32045

    return jdn
```

---

## No Oracle in Traditional Tzolkin

The traditional Tzolkin does NOT have the Dreamspell oracle system (Guide, Analog, Antipode, Occult).

For MVP:
- Tzolkin section shows ONLY: Day Sign + Tone
- No oracle map

---

## Validation

Use these known dates to validate calculations:

| Gregorian Date | Tzolkin | Notes |
|----------------|---------|-------|
| 2012-12-21 | 4 Ajaw | End of 13th Baktun |
| 2000-01-01 | 11 Ik' | |
| 1987-08-16 | 1 Imix | Start of new cycle |

---

## Display Format

Show as: `[Tone] [Day Sign]`

Examples:
- `4 Ajaw` (4 Sun)
- `7 Imix` (7 Dragon)
- `13 Kame` (13 Death)

With trilingual names:
```
7 Muluk
Moon — ירח
```

---
