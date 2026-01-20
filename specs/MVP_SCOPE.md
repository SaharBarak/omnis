# Omnis — MVP Scope Document

## Status: 🟢 DECISIONS LOCKED

**Last Updated:** 2025-01-20

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
**Title:** "According to the Dreamspell" / "לפי הדרימספל"

- **Mantra** (bilingual: Hebrew + English)
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
**Title:** "According to the Tzolkin" / "לפי הצולקין"

- **Sign + trilingual name**, format:
  - `Imix — Dragon — תנין`
  - `Muluc — Moon — ירח`
- **Tone number** (1-13)
- **Sign icon**

---

## MVP Inputs

For each person:
- ✅ Name (Hebrew)
- ✅ Birth date (DD.MM.YY format)

**Explicitly OUT for MVP:**
- ❌ Birth time
- ❌ Birth location
- ❌ Relationships

---

## Locked Decisions

### 1) Dreamspell Oracle Symbols ✅
| Position | Name | Location |
|----------|------|----------|
| Center | Kin | Middle |
| Top | Guide | Above center |
| Right | Analog | Right of center |
| Left | Antipode | Left of center |
| Bottom | Occult | Below center |

### 2) Mantra Source ✅
- **Source:** José Argüelles / Dreamspell Kit
- **Count:** 260 mantras (one per Kin)
- **Language:** Bilingual (Hebrew + English)
- **Note:** Hebrew translations needed

### 3) Tzolkin Scope ✅
- **Includes:** Seal + Tone
- **Format:** `[Tone] [Seal]` e.g., "7 Imix"
- **Names:** Trilingual (Mayan / English / Hebrew)

### 4) Icon Source ✅
- **Source:** Law of Time official icons
- **Format:** SVG preferred, PNG fallback
- **License:** Need to verify usage rights
- **Storage:** `public/icons/dreamspell/` and `public/icons/tzolkin/`

### 5) Map Layout ✅
- **Pattern:** Cross (standard Dreamspell oracle)
- **Visual:** Central Kin with 4 directional oracles

### 6) Language ✅
- **Mantras:** Bilingual (Hebrew primary, English secondary)
- **Sign names:** Trilingual (Mayan, English, Hebrew)
- **UI labels:** Bilingual (Hebrew + English)

---

## Test Data (16 People)

| Name | Birth Date | Full Date |
|------|------------|-----------|
| ליאור | 23.9.66 | 1966-09-23 |
| ילנה | 11.6.55 | 1955-06-11 |
| אביטל | 26.3.67 | 1967-03-26 |
| איתן | 19.2.57 | 1957-02-19 |
| יפעת | 10.8.71 | 1971-08-10 |
| מיכל | 9.7.68 | 1968-07-09 |
| אויה | 27.3.67 | 1967-03-27 |
| קרן | 28.11.76 | 1976-11-28 |
| עינת | 21.6.65 | 1965-06-21 |
| גניה | 25.2.66 | 1966-02-25 |
| גדי | 10.10.60 | 1960-10-10 |
| דינה | 2.4.77 | 1977-04-02 |
| סיגל | 1.10.68 | 1968-10-01 |
| מיטל | 1.11.78 | 1978-11-01 |
| אלנה | 19.7.56 | 1956-07-19 |
| ענת | 21.9.61 | 1961-09-21 |

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

The MVP is **DONE** when:
- [ ] A page renders one A5 card per person (16 cards)
- [ ] Each card contains:
  - [ ] Name (Hebrew)
  - [ ] Dreamspell mantra (Hebrew + English)
  - [ ] Dreamspell map (5 icons in cross pattern)
  - [ ] Tzolkin sign + trilingual name + tone + icon
- [ ] All icons load locally
- [ ] RTL layout (Hebrew primary)
- [ ] No runtime errors
- [ ] TypeScript clean
- [ ] No external calls

---

## Required Assets

### 20 Dreamspell Seals
1. Dragon (Imix) — תנין
2. Wind (Ik) — רוח
3. Night (Akbal) — לילה
4. Seed (Kan) — זרע
5. Serpent (Chicchan) — נחש
6. World-Bridger (Cimi) — מגשר עולמות
7. Hand (Manik) — יד
8. Star (Lamat) — כוכב
9. Moon (Muluc) — ירח
10. Dog (Oc) — כלב
11. Monkey (Chuen) — קוף
12. Human (Eb) — אדם
13. Skywalker (Ben) — הולך שמיים
14. Wizard (Ix) — קוסם
15. Eagle (Men) — נשר
16. Warrior (Cib) — לוחם
17. Earth (Caban) — אדמה
18. Mirror (Etznab) — מראה
19. Storm (Cauac) — סערה
20. Sun (Ahau) — שמש

### 13 Tone Icons
1-13 (may use numbers or distinct symbols)

---

## Next Steps

1. [ ] Verify Law of Time icon license
2. [ ] Create/source Hebrew mantra translations
3. [ ] Build Dreamspell calculation logic
4. [ ] Build Tzolkin calculation logic
5. [ ] Create lookup tables
6. [ ] Design A5 card component
7. [ ] Render test data

---
