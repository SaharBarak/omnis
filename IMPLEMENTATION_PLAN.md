# Omnis Implementation Plan

> **Status:** MVP COMPLETE — P1 Issues Resolved, P2 Work Remaining
> **Last Updated:** 2026-01-30
> **Last Verified:** 2026-01-30 (comprehensive codebase analysis with 8 parallel agents)
> **Goal:** Full-featured symbolic systems platform with 6 calculation systems

---

## Executive Summary

The Omnis platform is a complete symbolic systems web application featuring:
- **6 calculation systems:** Dreamspell, Tzolkin, Long Count, Human Design, Astrology, Gematria
- **User management:** OAuth authentication (Google, Apple, Email Magic Link), profiles, onboarding
- **People directory:** CRUD operations, tags, search, computed results caching
- **Relationships & Groups:** Graph visualization, compatibility analysis, group dynamics
- **Canvas editor:** Drag-and-drop boards, templates, PNG/SVG export
- **Predictions:** Daily/weekly/monthly forecasts, timelines, notifications
- **AI interpretations:** Claude-powered insights per person, relationship, group

### Current State

| Category | Status | Notes |
|----------|--------|-------|
| **MVP Functionality** | COMPLETE | All 16 cards render at `/app/cards` |
| **Build Status** | PASSING | Production build succeeds |
| **TypeScript** | CLEAN | No type errors (strict mode) |
| **Tests** | 487 PASSING | 15 test files total (11 in `src/lib/calculations/`, 4 in `src-mvp/`) |
| **Icons** | COMPLETE | 40 SVG icons (20 dreamspell seals, 20 tzolkin signs) |
| **Components** | 76 FILES | `src/lib/` fully production-ready, no TODOs |
| **Specs** | 30+ FILES | All system specs complete, 3 marked TODO |

### Comprehensive Analysis Summary (2026-01-30)

**8 parallel agents analyzed:**
1. **Specs (30+ files):** All MVP specs COMPLETE, 3 post-MVP specs marked TODO
2. **Calculations (11 modules):** 105+ exported functions, 382+ test cases, all production-ready
3. **Data (17 files):** Complete datasets for all 6 systems, proper immutability, no placeholders
4. **Types (13 files):** Comprehensive type coverage, prediction types now exported
5. **Card Components (17 files):** Full system coverage, 1 RTL/direction issue
6. **App Routes:** All routes functional, auth resolved, 0 route conflicts
7. **Code Quality:** Debug console.logs removed, 0 TODOs in source, 0 skipped tests
8. **Icons:** All 40 SVG icons present, oracle-wheel icon paths fixed

---

## P0: Critical Blockers

**None.** MVP is fully functional.

### Previously Resolved:

| Issue | Resolution |
|-------|------------|
| P0.1: Auth Route Conflict | Deleted `page.tsx`, kept `route.ts` |
| P0.2: TypeScript Violations | Added proper type imports |

---

## P1: Important (Affecting Correctness)

**All P1 items RESOLVED (2026-01-30):**

| Issue | Resolution |
|-------|------------|
| P1.1: Missing Occult Tone Calculation | Added `getOccultTone()` to oracle-tables.ts, `occultTone` to Oracle interface, updated calculateOracle, added 3 new tests |
| P1.2: Mantra Guide Line Accuracy | Fixed mantras.ts to use Guide seal's power, or "my own power doubled" for tones 1, 6, 11 |
| P1.3: Prediction Types Not Exported | Added 25 type exports + 2 constants + 1 function to types/index.ts |

---

## P2: Post-MVP Enhancements

### Resolved P2 Items (2026-01-30)

| Issue | Resolution |
|-------|------------|
| P2.1: Debug Statements | Removed 5 console.log from auth/callback/route.ts and use-auth.ts |
| P2.7: Oracle Wheel Icon Paths | Changed `seal.mayan.toLowerCase()` to `seal.english.toLowerCase()` |

### P2.2: I18N English-First (Display Components)
**Status:** MVP components DONE, non-MVP components have RTL cleanup remaining.

Per `/specs/I18N_ENGLISH_FIRST.md`:

**Priority 1 Components (Core Display) - VERIFIED COMPLETE:**
| Component | File | Status |
|-----------|------|--------|
| DreamspellSection | `src/components/cards/DreamspellSection.tsx` | ✅ DONE |
| TzolkinSection | `src/components/cards/TzolkinSection.tsx` | ✅ DONE |
| OracleMap | `src/components/cards/OracleMap.tsx` | ✅ DONE |
| MantraDisplay | `src/components/cards/MantraDisplay.tsx` | ✅ DONE |
| HumanDesignDisplay | `src/components/cards/HumanDesignDisplay.tsx` | ✅ DONE |
| AstrologyDisplay | `src/components/cards/AstrologyDisplay.tsx` | ✅ DONE |

**Remaining RTL Cleanup (VERIFIED - Non-MVP):**

*Card Components:*
| Component | Count | Notes |
|-----------|-------|-------|
| GematriaDisplay | 5× | Lines 176, 214, 269, 300, 407 |
| CastleDisplay | 1× | Line 53 |
| YearlyDisplay | 3× | Lines 31, 81, 140 |
| PersonCard | 1× | Line 13 (INTENTIONAL for Hebrew names) |

*Canvas Components (Lower Priority - 22 total):*
| Component | Count |
|-----------|-------|
| layers-panel.tsx | 3× |
| properties-panel.tsx | 4× |
| connection-properties.tsx | 5× |
| template-selector.tsx | 3× |
| export-dialog.tsx | 2× |
| Various node/edge components | 5× |

**Note:** PersonCard's `dir="rtl"` is intentional - TEST_PEOPLE have Hebrew names.

### P2.3: Test Coverage Expansion
**Current:** 484 tests across 11 test files in `src/lib/calculations/`

**Test File Distribution (VERIFIED):**
| File | Tests | Coverage |
|------|-------|----------|
| `human-design.test.ts` | 98 | Gates, channels, centers, bodygraph |
| `gematria.test.ts` | 78 | 7 calculation methods, letter values |
| `astrology.test.ts` | 51 | Zodiac, planets, houses, aspects |
| `long-count.test.ts` | 47 | Mayan calendar, Haab, Calendar Round |
| `cycles.test.ts` | 30 | Castles, families, harmonics |
| `oracle.test.ts` | 32 | Guide/analog/antipode/occult pairs + occultTone |
| `wavespell.test.ts` | 24 | 13-day wave cycles |
| `yearly.test.ts` | 24 | Year bearers, galactic birthdays |
| `dreamspell.test.ts` | 21 | Kin calculations, epoch |
| `tzolkin.test.ts` | 11 | Day signs, GMT correlation |
| `julian.test.ts` | 5 | JDN conversions |

**TEST_PEOPLE Usage (VERIFIED):**
- Only **2 of 16** birth dates used in assertions:
  - `1966-09-23` (ליאור) - astrology, long-count
  - `1955-06-11` (ילנה) - long-count, human-design
- **14 people untested:** אביטל, איתן, יפעת, מיכל, אויה, קרן, עינת, גניה, גדי, דינה, סיגל, מיטל, אלנה, ענת

**Missing Test Categories:**
| Category | Files Needing Tests | Priority |
|----------|---------------------|----------|
| Component tests | PersonCard, OracleMap, DreamspellSection, etc. | HIGH |
| Integration tests | End-to-end card rendering flows | MEDIUM |
| API route tests | `/api/ai/*`, `/api/predictions/*`, `/api/cron/*` | MEDIUM |
| Service tests | `compatibility.ts`, `group-analysis.ts`, `canvas-export.ts` | LOW |
| Hook tests | `use-people.ts`, `use-boards.ts`, `use-auth.ts` | LOW |

### P2.4: Specification Cleanup
3 spec files marked `Status: TODO`:
- `/specs/DESIGN_SYSTEM.md` - Design system partially implemented
- `/specs/LANDING_PAGE.md` - Landing page implemented but spec says TODO
- `/specs/AUTHENTIC_DATA.md` - Template mantras in use, not authentic 260

**Action:** Update spec status to match implementation reality.

### P2.5: PDF Export Enhancement
**Current:** Falls back to PNG for export.
**Future:** Implement `html2canvas` + `jspdf` for direct PDF download.

### P2.6: Authentic Mantras (Per AUTHENTIC_DATA.md)
- Source all 260 authentic mantras from Dreamspell Kit
- Translate mantras to Hebrew
- Guide reference in line 5 now correctly implemented
- Create expanded `mantras-full.ts` with complete data

### P2.8: PersonCard Direction Attribute
**Note:** The current plan says PersonCard's `dir="rtl"` is "intentional for Hebrew names". However, this **contradicts** `/specs/CARD_LAYOUT.md` line 155 which specifies `direction: ltr`.

**Current state:** `PersonCard.tsx` line 13 has `dir="rtl"` hardcoded.

**Resolution needed:** Clarify intended behavior:
- If RTL is correct (Hebrew-primary), update spec
- If LTR is correct (English-primary per spec), update PersonCard

**Complexity:** Trivial (~5 minutes once decision made)

---

## P3: Future Nice-to-Haves

### P3.1: Direction Consistency (RTL/LTR Toggle)
Cards currently use `dir="rtl"` (Hebrew primary).
If LTR is desired for English users:
- Remove `dir="rtl"` from PersonCard and sub-components
- Reorder text elements (English first, Hebrew secondary)
- Consider user locale preference setting

### P3.2: Design System Polish (Per DESIGN_SYSTEM.md)
- Implement consistent spacing scale
- Define typography scale
- Establish color system beyond defaults
- Add visual hierarchy (focal points, information architecture)
- Move from "generic admin template" to "mystical but clean" aesthetic

### P3.3: Birth Time/Place Input UI Integration
Per `/specs/DESIGN_SYSTEM.md`:
- Database has `birth_time` and `birth_place` columns
- UI components exist: `src/components/ui/birth-time-input.tsx`, `src/components/ui/location-picker.tsx`
- **Gap:** Components not yet integrated into People create/edit forms
- Human Design and Astrology calculations incomplete without this data

### P3.4: Landing Page Animations (Per LANDING_PAGE.md)
- Animated starfield with parallax
- Constellation lines connecting stars
- Smooth scroll animations
- Hyper-personalization messaging

---

## Completed Phases

| Phase | Name | Status |
|-------|------|--------|
| 0 (MVP) | A5 Card Components | COMPLETE |
| 1 | Core Web App (Accounts + Persistence) | COMPLETE |
| 2 | Relationship Graph + Groups | COMPLETE |
| 3 | Multi-System Expansion | COMPLETE |
| 4 | Canvas Editor + Dashboard | COMPLETE |
| 5 | Predictions + Time Intelligence | COMPLETE |
| 6 | AI Layer | COMPLETE |
| DS | Design System & UX | PARTIAL (basic implementation) |
| LP | Landing Page | PARTIAL (basic implementation) |
| AD | Authentic Data | PARTIAL (template mantras only) |
| UI | English-First Translation | MOSTLY DONE (MVP components complete, RTL cleanup pending) |

---

## Future Phases (Not Started)

| Phase | Name | Description |
|-------|------|-------------|
| 7 | SaaS Monetization | Billing at $30/mo |
| 8 | Platform Scale | Enterprise features |

---

## Commands

```bash
npm run dev           # Start dev server
npm run build         # Production build (PASSING)
npm run test          # Run tests (487 tests)
npm run typecheck     # TypeScript check (CLEAN)
```

---

## Definition of Done

### Core Requirements (ALL MET)
- [x] Cards page renders at `/app/cards`
- [x] Page displays one A5 card per person (16 cards total)
- [x] Navigation link exists in sidebar

### Per-Card Requirements (ALL MET)
- [x] Name displayed (Hebrew, bold, centered)
- [x] Dreamspell section with oracle map and mantra
- [x] Tzolkin section with day sign and tone
- [x] Trilingual display (Yucatec - English - Hebrew)

### Technical Requirements
- [x] All 40 icons load from local SVG files
- [x] RTL layout (Hebrew primary)
- [x] No runtime errors
- [x] TypeScript clean (strict mode)
- [x] Print CSS produces proper A5 layout
- [x] 487 tests passing
- [x] Production build succeeds

---

## Work Item Summary

| Priority | Count | Category |
|----------|-------|----------|
| **P0** | 0 | Critical blockers |
| **P1** | 0 | Important (all resolved) |
| **P2** | 6 | Post-MVP enhancements |
| **P3** | 4 | Future nice-to-haves |

### Quick Reference - Next Actions

1. **P2.2** - RTL Cleanup in non-MVP components (GematriaDisplay, CastleDisplay, YearlyDisplay)

2. **P2.3** - Test Coverage Expansion (component tests, integration tests, API tests)

3. **P2.4** - Specification Cleanup (update 3 spec files to match implementation)

4. **P2.5** - PDF Export Enhancement (html2canvas + jspdf)

5. **P2.6** - Authentic Mantras (source 260 authentic mantras, translate to Hebrew)

6. **P2.8** - Resolve PersonCard direction attribute
   - File: `src/components/cards/PersonCard.tsx` line 13
   - Clarify: spec says LTR, code has RTL

---

## References

- `/specs/MVP_SCOPE.md` - MVP requirements
- `/specs/CARD_LAYOUT.md` - A5 card visual spec
- `/specs/DREAMSPELL_SPEC.md` - Calculation details + Hebrew translations
- `/specs/TZOLKIN_SPEC.md` - Tzolkin system details
- `/specs/I18N_ENGLISH_FIRST.md` - Translation requirements
- `/specs/AUTHENTIC_DATA.md` - Authentic mantra sourcing
- `/specs/DESIGN_SYSTEM.md` - Design system specification
- `/specs/LANDING_PAGE.md` - Landing page specification
