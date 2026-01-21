# Omnis MVP Implementation Plan

> **Status:** COMPLETE - MVP Fully Implemented
> **Completed:** 2026-01-21
> **Build Status:** All TypeScript compiles, dev server runs, no errors
> **Tech Stack:** Vanilla TypeScript + Web Components + Vite

---

## Quick Start Summary

**Goal:** Render 16 A5 cards with Hebrew names, Dreamspell oracle maps, and Tzolkin data.

**Tech Stack (AUTHORITATIVE - MVP_SCOPE.md):**
- Vanilla TypeScript (strict mode)
- Web Components (Custom Elements v1)
- Zero runtime dependencies (only dev tools: Vite, TypeScript)
- No backend, AI calls, persistence, or routing

**Implementation:** Complete. Source code in `src/`, icons in `public/icons/`.

---

## Blockers & Workarounds (RESOLVED)

| Blocker | Severity | Workaround | Status |
|---------|----------|------------|--------|
| 260 mantras unavailable | HIGH | Template-based placeholder: "I [tone-action] in order to [seal-action]..." | RESOLVED |
| Icon licensing unclear | MEDIUM | Colored SVG circles with seal numbers (Red/White/Blue/Yellow by family) | RESOLVED |
| Hebrew mantra structure | LOW | Direct translation of English templates with RTL word order | RESOLVED |

**All blockers resolved with viable workarounds.**

---

## Spec Inconsistencies (Resolved)

1. **Analog Pairs** - Use DREAMSPELL_SPEC.md: 1-17, 2-19, 3-18, 4-8, 5-10, 6-7, 9-14, 11-12, 13-20, 15-16
2. **Epoch Kin Name** - Mathematical verification: Kin 34 = Seal 14 (Wizard) + Tone 8 (Galactic) = **White Galactic Wizard** (not "Yellow Galactic Seed")
3. **Hebrew Names** - Use DREAMSPELL_SPEC.md as authoritative for Dreamspell seals
   - NOTE: `specs/systems/DREAMSPELL.md` has "דרקון" for Dragon, but DREAMSPELL_SPEC.md has "תנין" - **use "תנין"**
   - Similarly for other seals where discrepancies exist
4. **Tzolkin Day Signs** - Signs 6, 13, 14, 16 intentionally differ from Dreamspell (traditional vs modern):
   - 6: Kimi (Death) vs Cimi (World-Bridger)
   - 13: B'en (Reed) vs Ben (Skywalker)
   - 14: Ix (Jaguar) vs Ix (Wizard)
   - 16: Kib' (Owl) vs Cib (Warrior)
5. **Font Strategy** - Use system-ui fallback with Heebo/Assistant as enhancement (no CDN dependency)

### Spec File Priority (for conflicts)
1. `specs/MVP_SCOPE.md` - AUTHORITATIVE for requirements and tech stack
2. `specs/DREAMSPELL_SPEC.md` - AUTHORITATIVE for Dreamspell algorithms and data
3. `specs/TZOLKIN_SPEC.md` - AUTHORITATIVE for Tzolkin algorithms
4. `specs/CARD_LAYOUT.md` - AUTHORITATIVE for visual design
5. `AGENTS.md` - Reference for code patterns and design tokens
6. `specs/systems/*.md` - Reference only (may have outdated data)

---

## Critical Path Summary

```
Phase 1 (Bootstrap) -> Phase 2 (Types) -> Phase 3 (Data) -> Phase 4 (Calculations)
                              |                                       |
                              +---> Phase 5 (Assets) [PARALLEL] ------+
                                                                      |
                                                                      v
                                    Phase 6 (Components) -> Phase 7 (Integration) -> Phase 8 (Validation)
```

**All phases complete.**

---

## Definition of Done (ACHIEVED)

The MVP is **DONE** - ALL requirements met:

- [x] 16 A5 cards render (one per person from TEST_DATA.json)
- [x] Each card contains:
  - [x] Hebrew name (large, centered)
  - [x] Dreamspell section title (bilingual)
  - [x] Dreamspell mantra (Hebrew + English, placeholder OK)
  - [x] Dreamspell oracle map (5 icons in cross pattern)
  - [x] Tzolkin section title (bilingual)
  - [x] Tzolkin sign icon + trilingual name + tone
- [x] All icons load locally (placeholder circles acceptable)
- [x] RTL layout correct (Hebrew primary)
- [x] No runtime errors in browser console
- [x] TypeScript compiles without errors (`strict: true`)
- [x] No external API/network calls at runtime
- [x] Print preview renders correctly

---

## Quick Reference Data

### Analog Pairs (AUTHORITATIVE - from DREAMSPELL_SPEC.md)
```
1 <-> 17 (Dragon <-> Earth)
2 <-> 19 (Wind <-> Storm)
3 <-> 18 (Night <-> Mirror)
4 <-> 8  (Seed <-> Star)
5 <-> 10 (Serpent <-> Dog)
6 <-> 7  (World-Bridger <-> Hand)
9 <-> 14 (Moon <-> Wizard)
11 <-> 12 (Monkey <-> Human)
13 <-> 20 (Skywalker <-> Sun)
15 <-> 16 (Eagle <-> Warrior)
```

### Guide Calculation by Tone
```
Tone 1, 6, 11  -> same seal (offset 0)
Tone 2, 7, 12  -> ((seal - 1 + 12) % 20) + 1
Tone 3, 8, 13  -> ((seal - 1 + 4) % 20) + 1
Tone 4, 9      -> ((seal - 1 + 16) % 20) + 1
Tone 5, 10     -> ((seal - 1 + 8) % 20) + 1
```

### Oracle Formulas
```
Antipode: ((seal - 1 + 10) % 20) + 1
Occult:   21 - seal
Analog:   Lookup table (see pairs above)
Guide:    Tone-dependent offset (see above)
```

### Color Families
| Color | Hex | Seals |
|-------|-----|-------|
| Red | #DC2626 | 1, 5, 9, 13, 17 |
| White | #F3F4F6 | 2, 6, 10, 14, 18 |
| Blue | #2563EB | 3, 7, 11, 15, 19 |
| Yellow | #F59E0B | 4, 8, 12, 16, 20 |

### 20 Dreamspell Seals
| # | Mayan | English | Hebrew | Color |
|---|-------|---------|--------|-------|
| 1 | Imix | Dragon | תנין | Red |
| 2 | Ik | Wind | רוח | White |
| 3 | Akbal | Night | לילה | Blue |
| 4 | Kan | Seed | זרע | Yellow |
| 5 | Chicchan | Serpent | נחש | Red |
| 6 | Cimi | World-Bridger | מגשר עולמות | White |
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

### 13 Tones
| # | Name | Hebrew | Keywords | Action |
|---|------|--------|----------|--------|
| 1 | Magnetic | מגנטי | Unify, Attract, Purpose | unify |
| 2 | Lunar | ירחי | Polarize, Stabilize, Challenge | polarize |
| 3 | Electric | חשמלי | Activate, Bond, Service | activate |
| 4 | Self-Existing | קיים-עצמי | Define, Measure, Form | define |
| 5 | Overtone | על-טון | Empower, Command, Radiance | empower |
| 6 | Rhythmic | קצבי | Organize, Balance, Equality | organize |
| 7 | Resonant | מהדהד | Channel, Inspire, Attunement | channel |
| 8 | Galactic | גלקטי | Harmonize, Model, Integrity | harmonize |
| 9 | Solar | שמשי | Pulse, Realize, Intention | realize |
| 10 | Planetary | כוכבי | Perfect, Produce, Manifestation | perfect |
| 11 | Spectral | ספקטרלי | Dissolve, Release, Liberation | dissolve |
| 12 | Crystal | קריסטלי | Dedicate, Universalize, Cooperation | dedicate |
| 13 | Cosmic | קוסמי | Endure, Transcend, Presence | transcend |

### 20 Tzolkin Day Signs (Traditional - differs from Dreamspell)
| # | Yucatec | English | Hebrew | Dreamspell Equivalent |
|---|---------|---------|--------|----------------------|
| 1 | Imix | Crocodile | תנין | Dragon |
| 2 | Ik' | Wind | רוח | Wind |
| 3 | Ak'b'al | Night | לילה | Night |
| 4 | K'an | Seed | זרע | Seed |
| 5 | Chikchan | Serpent | נחש | Serpent |
| 6 | Kimi | Death | מוות | World-Bridger |
| 7 | Manik' | Deer/Hand | יד | Hand |
| 8 | Lamat | Rabbit/Star | כוכב | Star |
| 9 | Muluk | Water/Moon | ירח | Moon |
| 10 | Ok | Dog | כלב | Dog |
| 11 | Chuwen | Monkey | קוף | Monkey |
| 12 | Eb' | Road/Human | אדם | Human |
| 13 | B'en | Reed | קנה | Skywalker |
| 14 | Ix | Jaguar | יגואר | Wizard |
| 15 | Men | Eagle | נשר | Eagle |
| 16 | Kib' | Owl | ינשוף | Warrior |
| 17 | Kab'an | Earth | אדמה | Earth |
| 18 | Etz'nab' | Flint/Mirror | מראה | Mirror |
| 19 | Kawak | Storm | סערה | Storm |
| 20 | Ajaw | Lord/Sun | שמש | Sun |

### 16 Test People (from specs/TEST_DATA.json)
| Name | Birth Date |
|------|------------|
| ליאור | 1966-09-23 |
| ילנה | 1955-06-11 |
| אביטל | 1967-03-26 |
| איתן | 1957-02-19 |
| יפעת | 1971-08-10 |
| מיכל | 1968-07-09 |
| אויה | 1967-03-27 |
| קרן | 1976-11-28 |
| עינת | 1965-06-21 |
| גניה | 1966-02-25 |
| גדי | 1960-10-10 |
| דינה | 1977-04-02 |
| סיגל | 1968-10-01 |
| מיטל | 1978-11-01 |
| אלנה | 1956-07-19 |
| ענת | 1961-09-21 |

---

## Reference Files

| File | Purpose |
|------|---------|
| `/specs/MVP_SCOPE.md` | **AUTHORITATIVE** requirements and locked decisions |
| `/specs/DREAMSPELL_SPEC.md` | Dreamspell algorithms (use for analog pairs, oracle rules) |
| `/specs/TZOLKIN_SPEC.md` | Tzolkin algorithms (GMT correlation 584283) |
| `/specs/CARD_LAYOUT.md` | Visual layout specifications and component hierarchy |
| `/specs/TEST_DATA.json` | 16 test people with Hebrew names and birth dates |
| `/AGENTS.md` | Design tokens, code patterns, calculation pseudocode |

**WARNING:** `/specs/systems/DREAMSPELL.md` may have outdated analog pairs - use `/specs/DREAMSPELL_SPEC.md` instead.

---

## Progress Tracker

| Phase | Status | Tasks | Complete |
|-------|--------|-------|----------|
| 1. Bootstrap | COMPLETE | 10 | 10/10 |
| 2. Types | COMPLETE | 9 | 9/9 |
| 3. Data | COMPLETE | 8 | 8/8 |
| 4. Calculations | COMPLETE | 9 | 9/9 |
| 5. Assets | COMPLETE | 5 | 5/5 |
| 6. Components | COMPLETE | 14 | 14/14 |
| 7. Integration | COMPLETE | 5 | 5/5 |
| 8. Validation | COMPLETE | 15 | 15/15 |
| **TOTAL** | **100%** | **75** | **75/75** |

---

## Analysis Notes / Implementation Complete (2026-01-21)

### Verified Correct
- Calculation formulas match specs
- Analog pairs from DREAMSPELL_SPEC.md are authoritative
- Guide offset formula is correct
- Tzolkin GMT correlation 584283 is correct
- Phase dependencies are properly ordered

### Corrections Applied
- Epoch Kin name corrected to "White Galactic Wizard" (not "Yellow Galactic Seed")
- Added missing tasks: .gitignore, common.ts, section-title component, accessibility, cross-browser testing
- Added pre-1987 test case for negative day handling
- Clarified Tzolkin leap day handling (counts normally, differs from Dreamspell)
- Corrected Dreamspell test dates: The original expected Kin values for 2000-01-01 and 2024-02-28 were incorrect. Verified against epoch (Kin 34) and End of Long Count (2012-12-21 = Kin 207).
- Corrected Tzolkin day sign offset from 16 to 20 to match 2012-12-21 = 4 Ajaw

### Implementation Verification
- **Verified**: `npm run build` completes with zero errors
- **Verified**: `npm run typecheck` passes
- **Verified**: Dev server starts successfully on port 5173
- **Verified**: 33 TypeScript files in src/
- **Verified**: 40 SVG icon files (20 Dreamspell seals + 20 Tzolkin signs)
- **Verified**: 16 test people render as cards
- **Verified**: All components implemented with Shadow DOM
- **Verified**: RTL layout with Hebrew support
- **Verified**: Print styles for A5 pages
