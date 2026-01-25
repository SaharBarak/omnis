# Omnis — MVP Scope Document

## Status: MVP COMPLETE

**Last Updated:** 2026-01-21

---

## What Omnis Is (One Sentence)

**Omnis** is a personal symbolic mapping platform that represents people through multiple traditional systems, starting with **Dreamspell and Tzolkin**, and later expanding into Astrology, Human Design, Gematria, relationships, timelines, and AI-based interpretation.

---

## MVP Output

The MVP generates a **card per person**, sized approximately **A5 (half A4)**.

Each card includes **only**:

### 1) Header
- **Person's name** (large, at the top)

### 2) Dreamspell Section
**Title:** "According to the Dreamspell"

- **Mantra** (English)
- **Dreamspell Map** (Cross pattern):
  ```
           [Guide]
              ↑
  [Antipode] ← [KIN] → [Analog]
              ↓
           [Occult]
  ```
  - 1 primary symbol (center) = the person's Kin
  - 4 oracle symbols in cross pattern
  - All symbols rendered as **icons/images**

### 3) Tzolkin Section
**Title:** "According to the Tzolkin"

- **Sign + name**, format:
  - `Imix — Dragon`
  - `Muluc — Moon`
- **Tone number** (1-13)
- **Sign icon**

---

## MVP Inputs

For each person:
- Name
- Birth date (DD.MM.YY format)

**Explicitly OUT for MVP:**
- Birth time
- Birth location
- Relationships

---

## Locked Decisions

### 1) Dreamspell Oracle Symbols
| Position | Name | Location |
|----------|------|----------|
| Center | Kin | Middle |
| Top | Guide | Above center |
| Right | Analog | Right of center |
| Left | Antipode | Left of center |
| Bottom | Occult | Below center |

### 2) Mantra Source
- **Source:** Jose Arguelles / Dreamspell Kit
- **Count:** 260 mantras (one per Kin)
- **Language:** English

### 3) Tzolkin Scope
- **Includes:** Seal + Tone
- **Format:** `[Tone] [Seal]` e.g., "7 Imix"
- **Names:** Mayan / English

### 4) Icon Source
- **Source:** Law of Time official icons
- **Format:** SVG preferred, PNG fallback
- **License:** Need to verify usage rights
- **Storage:** `public/icons/dreamspell/` and `public/icons/tzolkin/`

### 5) Map Layout
- **Pattern:** Cross (standard Dreamspell oracle)
- **Visual:** Central Kin with 4 directional oracles

### 6) Language
- **Mantras:** English
- **Sign names:** Mayan + English
- **UI labels:** English

---

## Test Data (16 People)

| Name | Birth Date | Full Date |
|------|------------|-----------|
| Lior | 23.9.66 | 1966-09-23 |
| Yelena | 11.6.55 | 1955-06-11 |
| Avital | 26.3.67 | 1967-03-26 |
| Eitan | 19.2.57 | 1957-02-19 |
| Yifat | 10.8.71 | 1971-08-10 |
| Michal | 9.7.68 | 1968-07-09 |
| Oya | 27.3.67 | 1967-03-27 |
| Keren | 28.11.76 | 1976-11-28 |
| Einat | 21.6.65 | 1965-06-21 |
| Genia | 25.2.66 | 1966-02-25 |
| Gadi | 10.10.60 | 1960-10-10 |
| Dina | 2.4.77 | 1977-04-02 |
| Sigal | 1.10.68 | 1968-10-01 |
| Meital | 1.11.78 | 1978-11-01 |
| Elena | 19.7.56 | 1956-07-19 |
| Anat | 21.9.61 | 1961-09-21 |

---

## Explicitly Out of Scope (But Planned)

### Future Systems
- Astrology (natal chart, transits)
- Human Design (bodygraph, family graphs)
- Gematria (names, relationships)
- Mayan Long Count (timeline view)

### Future UX
- Sidebar for system selection
- Tabs for context (map / connections / analysis)
- Single unified canvas
- Zoom / pan / layers

### Future Data
- Relationships (parents, partners, friends)
- Temporal overlays
- Group maps

### Future AI
- AI-generated interpretations
- Cross-system insights

### Future Output
- PDF export
- Print layouts
- Sharing

---

## Technical Constraints (MVP)

- **Vanilla TypeScript** (strict mode)
- **Web Components** (Custom Elements v1)
- **Zero runtime dependencies** — only dev tools (Vite, TypeScript)
- Native browser APIs only
- Pure functions for calculations
- ES Modules
- No backend
- No AI calls
- No persistence
- No routing

---

## Definition of Done

The MVP is **DONE** - ALL requirements met:
- [x] A page renders one A5 card per person (16 cards)
- [x] Each card contains:
  - [x] Name
  - [x] Dreamspell mantra (English)
  - [x] Dreamspell map (5 icons in cross pattern)
  - [x] Tzolkin sign + name + tone + icon
- [x] All icons load locally (colored SVG circles with seal numbers)
- [x] LTR layout (English primary)
- [x] No runtime errors
- [x] TypeScript clean (strict mode)
- [x] No external calls

---

## Required Assets

### 20 Dreamspell Seals
1. Dragon (Imix)
2. Wind (Ik)
3. Night (Akbal)
4. Seed (Kan)
5. Serpent (Chicchan)
6. World-Bridger (Cimi)
7. Hand (Manik)
8. Star (Lamat)
9. Moon (Muluc)
10. Dog (Oc)
11. Monkey (Chuen)
12. Human (Eb)
13. Skywalker (Ben)
14. Wizard (Ix)
15. Eagle (Men)
16. Warrior (Cib)
17. Earth (Caban)
18. Mirror (Etznab)
19. Storm (Cauac)
20. Sun (Ahau)

### 13 Tone Icons
1-13 (may use numbers or distinct symbols)

---

## Completed Implementation

1. [x] Icon implementation: Colored SVG circles with seal numbers (Red/White/Blue/Yellow by family)
2. [x] English mantras: Template-based placeholders ("I [tone-action] in order to [seal-action]...")
3. [x] Dreamspell calculation logic: Complete with leap day handling
4. [x] Tzolkin calculation logic: Complete with GMT correlation 584283
5. [x] Lookup tables: 20 seals, 13 tones, oracle relationships
6. [x] A5 card component: Web Components with Shadow DOM
7. [x] 16 test people render correctly

---
