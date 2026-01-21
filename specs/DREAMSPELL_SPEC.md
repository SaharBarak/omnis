# Dreamspell Calculation Specification

## Overview

The Dreamspell is a calendar system created by José Argüelles. It assigns a "Galactic Signature" (Kin) to each day based on a 260-day cycle (Tzolkin) synchronized with the solar year.

---

## Core Concepts

### Kin (1-260)
- Each day has a Kin number from 1 to 260
- Kin = combination of Seal (1-20) × Tone (1-13)
- 20 × 13 = 260

### Seal (Solar Tribe) — 20 total
The "what" — the archetype/energy type.

| # | Mayan | English | Hebrew |
|---|-------|---------|--------|
| 1 | Imix | Dragon | תנין |
| 2 | Ik | Wind | רוח |
| 3 | Akbal | Night | לילה |
| 4 | Kan | Seed | זרע |
| 5 | Chicchan | Serpent | נחש |
| 6 | Cimi | World-Bridger | מגשר עולמות |
| 7 | Manik | Hand | יד |
| 8 | Lamat | Star | כוכב |
| 9 | Muluc | Moon | ירח |
| 10 | Oc | Dog | כלב |
| 11 | Chuen | Monkey | קוף |
| 12 | Eb | Human | אדם |
| 13 | Ben | Skywalker | הולך שמיים |
| 14 | Ix | Wizard | קוסם |
| 15 | Men | Eagle | נשר |
| 16 | Cib | Warrior | לוחם |
| 17 | Caban | Earth | אדמה |
| 18 | Etznab | Mirror | מראה |
| 19 | Cauac | Storm | סערה |
| 20 | Ahau | Sun | שמש |

### Tone (Galactic Tone) — 13 total
The "how" — the creative power/purpose.

| # | Name | Hebrew | Keyword |
|---|------|--------|---------|
| 1 | Magnetic | מגנטי | Unify, Attract, Purpose |
| 2 | Lunar | ירחי | Polarize, Stabilize, Challenge |
| 3 | Electric | חשמלי | Activate, Bond, Service |
| 4 | Self-Existing | קיים-עצמי | Define, Measure, Form |
| 5 | Overtone | על-טון | Empower, Command, Radiance |
| 6 | Rhythmic | קצבי | Organize, Balance, Equality |
| 7 | Resonant | מהדהד | Channel, Inspire, Attunement |
| 8 | Galactic | גלקטי | Harmonize, Model, Integrity |
| 9 | Solar | שמשי | Pulse, Realize, Intention |
| 10 | Planetary | כוכבי | Perfect, Produce, Manifestation |
| 11 | Spectral | ספקטרלי | Dissolve, Release, Liberation |
| 12 | Crystal | קריסטלי | Dedicate, Universalize, Cooperation |
| 13 | Cosmic | קוסמי | Endure, Transcend, Presence |

---

## Calculation: Date → Kin

### Reference Point (Epoch)
- **July 26, 1987** = Kin 34 (White Galactic Wizard)
- This is the Dreamspell "Harmonic Convergence" sync date

### Algorithm

```
1. Calculate days since epoch (July 26, 1987)
2. Add the epoch Kin number (34)
3. Modulo 260 (wrap around)
4. If result is 0, it's Kin 260
```

### Pseudocode

```
function dateToKin(date):
    epoch = Date(1987, 7, 26)
    epochKin = 34

    daysDiff = daysBetween(epoch, date)
    kin = ((daysDiff + epochKin - 1) % 260) + 1

    return kin  // 1-260
```

### Kin → Seal & Tone

```
function kinToSeal(kin):
    return ((kin - 1) % 20) + 1  // 1-20

function kinToTone(kin):
    return ((kin - 1) % 13) + 1  // 1-13
```

---

## Oracle Calculation

Each Kin has 4 oracle positions determined by mathematical relationships.

### Oracle Positions

```
           [Guide]
              ↑
  [Antipode] ← [KIN] → [Analog]
              ↓
           [Occult]
```

### Oracle Rules (by Seal number)

#### Analog (Support)
Same tone, related seal. The Analog seal is:
| Seal | Analog Seal |
|------|-------------|
| 1 (Dragon) | 17 (Earth) |
| 2 (Wind) | 19 (Storm) |
| 3 (Night) | 18 (Mirror) |
| 4 (Seed) | 8 (Star) |
| 5 (Serpent) | 10 (Dog) |
| 6 (World-Bridger) | 7 (Hand) |
| 7 (Hand) | 6 (World-Bridger) |
| 8 (Star) | 4 (Seed) |
| 9 (Moon) | 14 (Wizard) |
| 10 (Dog) | 5 (Serpent) |
| 11 (Monkey) | 12 (Human) |
| 12 (Human) | 11 (Monkey) |
| 13 (Skywalker) | 20 (Sun) |
| 14 (Wizard) | 9 (Moon) |
| 15 (Eagle) | 16 (Warrior) |
| 16 (Warrior) | 15 (Eagle) |
| 17 (Earth) | 1 (Dragon) |
| 18 (Mirror) | 3 (Night) |
| 19 (Storm) | 2 (Wind) |
| 20 (Sun) | 13 (Skywalker) |

#### Antipode (Challenge)
Same tone, seal + 10 (mod 20).
```
antipodeSeal = ((seal - 1 + 10) % 20) + 1
```

#### Occult (Hidden Power)
Tone = 14 - originalTone (if 0, use 13).
Seal: The occult seal pairs are:
| Seal | Occult Seal |
|------|-------------|
| 1 | 20 |
| 2 | 19 |
| 3 | 18 |
| 4 | 17 |
| 5 | 16 |
| 6 | 15 |
| 7 | 14 |
| 8 | 13 |
| 9 | 12 |
| 10 | 11 |
| 11 | 10 |
| 12 | 9 |
| 13 | 8 |
| 14 | 7 |
| 15 | 6 |
| 16 | 5 |
| 17 | 4 |
| 18 | 3 |
| 19 | 2 |
| 20 | 1 |

Formula: `occultSeal = 21 - seal`

#### Guide
Same tone as Kin. Seal determined by tone:
- Tone 1, 6, 11: Guide = same seal as Kin
- Tone 2, 7, 12: Guide = seal + 12 (mod 20)
- Tone 3, 8, 13: Guide = seal + 4 (mod 20)
- Tone 4, 9: Guide = seal + 16 (mod 20)
- Tone 5, 10: Guide = seal + 8 (mod 20)

---

## Mantra Structure

Each Kin (1-260) has an affirmation/mantra.

Format:
```
"I [action] in order to [purpose]
[power word] [quality]
I seal the [output] of [energy]
With the [tone adjective] tone of [tone noun]
I am guided by [guide condition]"
```

Example (Kin 1 - Red Magnetic Dragon):
```
"I unify in order to nurture
Attracting being
I seal the input of birth
With the magnetic tone of purpose
I am guided by my own power doubled"
```

**Note:** 260 mantras need to be sourced from Dreamspell materials.

---

## Leap Year Handling

**Important:** Dreamspell does NOT count February 29 (leap day).

- Feb 29 is considered "Day Out of Time" or skipped
- This keeps the Kin synchronized across years

When calculating:
- If date is Feb 29, use Feb 28's Kin
- When counting days, skip Feb 29s

---

## Validation

Use these known dates to validate calculations:

| Date | Kin | Seal | Tone | Name |
|------|-----|------|------|------|
| 1987-07-26 | 34 | White | 8 | White Galactic Wizard |
| 2000-01-01 | 153 | Red | 10 | Red Planetary Skywalker |
| 2012-12-21 | 207 | Blue | 12 | Blue Crystal Hand |

---
