# Omnis Implementation Plan

> **Status:** MVP COMPLETE — P1 Issues Resolved, P2 Work Remaining
> **Last Updated:** 2026-01-31
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
| **Tests** | 895 PASSING | 27 test files (11 calculations + 4 services + 6 API routes + 2 components + 4 hooks/utils) |
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
| P2.2: I18N English-First RTL Cleanup | Removed RTL from GematriaDisplay (4×), CastleDisplay (1×), YearlyDisplay (3×), PersonCard (1×), share/[token]/page.tsx (4×), boards/[id]/page.tsx (1×) - all now English-first LTR |
| P2.4: Specification Cleanup | Updated 3 spec files (DESIGN_SYSTEM, LANDING_PAGE, AUTHENTIC_DATA) to PARTIAL status |
| P2.7: Oracle Wheel Icon Paths | Changed `seal.mayan.toLowerCase()` to `seal.english.toLowerCase()` |
| P2.8: PersonCard Direction | Changed `dir="rtl"` to `dir="ltr"` per CARD_LAYOUT.md spec (English-first) |

### P2.2: I18N English-First (Display Components)
**Status:** COMPLETE - All card components now English-first LTR.

Per `/specs/I18N_ENGLISH_FIRST.md`:

**All Card Components - VERIFIED COMPLETE:**
| Component | File | Status |
|-----------|------|--------|
| PersonCard | `src/components/cards/PersonCard.tsx` | ✅ DONE (LTR) |
| DreamspellSection | `src/components/cards/DreamspellSection.tsx` | ✅ DONE |
| TzolkinSection | `src/components/cards/TzolkinSection.tsx` | ✅ DONE |
| OracleMap | `src/components/cards/OracleMap.tsx` | ✅ DONE |
| MantraDisplay | `src/components/cards/MantraDisplay.tsx` | ✅ DONE |
| HumanDesignDisplay | `src/components/cards/HumanDesignDisplay.tsx` | ✅ DONE |
| AstrologyDisplay | `src/components/cards/AstrologyDisplay.tsx` | ✅ DONE |
| GematriaDisplay | `src/components/cards/GematriaDisplay.tsx` | ✅ DONE (RTL kept for Hebrew letter display only) |
| CastleDisplay | `src/components/cards/CastleDisplay.tsx` | ✅ DONE |
| YearlyDisplay | `src/components/cards/YearlyDisplay.tsx` | ✅ DONE |

**Canvas Components RTL Cleanup - COMPLETE (2026-01-31):**
All 15 canvas components updated to LTR with English UI:
| Component | Changes |
|-----------|---------|
| text-node.tsx | Changed defaults to LTR, English placeholder |
| sticky-node.tsx | Changed to LTR, English placeholder |
| callout-node.tsx | Changed to LTR, English placeholder |
| person-node.tsx | Changed to LTR, English system labels |
| highlight-node.tsx | Changed to LTR |
| line-edge.tsx | Changed to LTR |
| curve-edge.tsx | Changed to LTR |
| flow-edge.tsx | Changed to LTR |
| relationship-edge.tsx | Changed to LTR |
| canvas-editor.tsx | Changed default text style to LTR |
| layers-panel.tsx | Changed to LTR, English UI labels |
| properties-panel.tsx | Changed to LTR, English UI labels |
| connection-properties.tsx | Changed to LTR, English UI labels |
| template-selector.tsx | Changed to LTR, English UI labels |
| export-dialog.tsx | Changed to LTR, English UI labels |

**Note:** All canvas components now use English-first LTR layout.

**Additional Pages RTL Cleanup - COMPLETE (2026-01-31):**
| Page | Changes |
|------|---------|
| share/[token]/page.tsx | Changed all 4 `dir="rtl"` to LTR, translated Hebrew UI to English |
| boards/[id]/page.tsx | Changed `dir="rtl"` to LTR, translated Hebrew UI to English |

### P2.3: Test Coverage Expansion
**Current:** 895 tests across 27 test files (2026-01-31)

**Test File Distribution:**
| File | Tests | Coverage |
|------|-------|----------|
| `human-design.test.ts` | 98 | Gates, channels, centers, bodygraph |
| `gematria.test.ts` | 78 | 7 calculation methods, letter values |
| `predictions.test.ts` | 55 | Daily/weekly/monthly predictions, timelines, date utilities |
| `send-notifications.test.ts` (API) | 52 | Cron auth, time windows, notification processing |
| `astrology.test.ts` | 51 | Zodiac, planets, houses, aspects |
| `compatibility.test.ts` | 47 | Dreamspell/Tzolkin compatibility, oracle relationships, score colors |
| `long-count.test.ts` | 47 | Mayan calendar, Haab, Calendar Round |
| `daily-predictions.test.ts` (API) | 45 | Cron auth, people processing, error handling |
| `display-components.test.tsx` | 45 | WavespellDisplay, CastleDisplay, YearlyDisplay (all variants) |
| `predictions.test.ts` (API) | 42 | GET/POST predictions endpoints, caching, validation |
| `group-analysis.test.ts` | 37 | Group member analysis, distributions, compatibility matrix, insights |
| `cards.test.tsx` | 36 | PersonCard, DreamspellSection, TzolkinSection, OracleMap, MantraDisplay, SealIcon |
| `canvas-export.test.ts` | 34 | PNG/JPEG/SVG export, download, data URL conversion |
| `oracle.test.ts` | 32 | Guide/analog/antipode/occult pairs + occultTone |
| `cycles.test.ts` | 30 | Castles, families, harmonics |
| `daily-kin.test.ts` (API) | 25 | Cron auth, email sending, error handling |
| `wavespell.test.ts` | 24 | 13-day wave cycles |
| `yearly.test.ts` | 24 | Year bearers, galactic birthdays |
| `use-auth.test.ts` | 21 | Auth hook: OAuth, OTP, sign out, state changes |
| `dreamspell.test.ts` | 21 | Kin calculations, epoch |
| `interpret.test.ts` (API) | 16 | AI interpretation endpoint, input validation, error handling |
| `timeline.test.ts` (API) | 14 | Timeline API endpoint, date range queries |
| `tzolkin.test.ts` | 11 | Day signs, GMT correlation |
| `board-templates.test.ts` | 41 | Template configs, canvas generation, layouts, connections |
| `use-system-preferences.test.ts` | 17 | System preferences merging, isSystemEnabled, loading state |
| `utils.test.ts` | 12 | cn() className utility, Tailwind class merging |
| `julian.test.ts` | 5 | JDN conversions |

**Test Infrastructure:**
- Vitest 4.0 + @testing-library/react + jsdom environment
- Mock for Next.js Image component
- Configuration: `vitest.config.ts` with React plugin

**Completed Test Categories (2026-01-30):**
| Category | Status | Tests Added |
|----------|--------|-------------|
| Service tests: predictions.ts | ✅ COMPLETE | 55 tests |
| Service tests: compatibility.ts | ✅ COMPLETE | 47 tests |
| Service tests: group-analysis.ts | ✅ COMPLETE | 37 tests |
| Service tests: canvas-export.ts | ✅ COMPLETE | 34 tests |
| API route tests: /api/ai/interpret | ✅ COMPLETE | 16 tests |
| API route tests: /api/predictions | ✅ COMPLETE | 42 tests |
| API route tests: /api/predictions/timeline | ✅ COMPLETE | 14 tests |
| API route tests: /api/cron/daily-predictions | ✅ COMPLETE | 45 tests |
| API route tests: /api/cron/daily-kin | ✅ COMPLETE | 25 tests |
| API route tests: /api/cron/send-notifications | ✅ COMPLETE | 52 tests |
| Hook tests: use-auth.ts | ✅ COMPLETE | 21 tests |
| Hook tests: use-system-preferences.ts | ✅ COMPLETE | 17 tests |
| Service tests: board-templates.ts | ✅ COMPLETE | 41 tests |
| Utility tests: utils.ts | ✅ COMPLETE | 12 tests |

**Remaining Test Categories:**
| Category | Files Needing Tests | Priority |
|----------|---------------------|----------|
| Hook tests | `use-people.ts`, `use-boards.ts` | LOW (memory-intensive mocking causes vitest worker timeouts) |

**Note (2026-01-31):** A draft `use-people.test.ts` was removed due to vitest worker fork timeout issues. Hook tests with complex Supabase mocking require careful async handling to avoid infinite loops during component mount. Consider using `@testing-library/react`'s `waitFor` with explicit timeout controls or running these tests in isolation with `pool: 'forks'` and extended timeouts.

### P2.4: Specification Cleanup
**Status:** COMPLETE - All 3 spec files updated to PARTIAL status.

| Spec File | New Status |
|-----------|------------|
| `/specs/DESIGN_SYSTEM.md` | PARTIAL (basic implementation complete, advanced features pending) |
| `/specs/LANDING_PAGE.md` | PARTIAL (basic landing page implemented, animations pending) |
| `/specs/AUTHENTIC_DATA.md` | PARTIAL (template mantras in use, authentic 260 mantras pending) |

### P2.5: PDF Export Enhancement
**Status:** COMPLETE - html2canvas and jspdf now installed and working.

**Resolution:** Added html2canvas and jspdf dependencies to enable proper PDF export in canvas-export.ts. The export now uses jspdf directly instead of the previous PNG fallback approach. Tests updated to cover PDF export functionality.

### P2.6: Authentic Mantras (Per AUTHENTIC_DATA.md)
- Source all 260 authentic mantras from Dreamspell Kit
- Translate mantras to Hebrew
- Guide reference in line 5 now correctly implemented
- Create expanded `mantras-full.ts` with complete data

### P2.8: PersonCard Direction Attribute
**Status:** COMPLETE - Changed to LTR per CARD_LAYOUT.md spec (English-first).

**Resolution:** PersonCard.tsx line 13 changed from `dir="rtl"` to `dir="ltr"` to match the CARD_LAYOUT.md specification which defines `direction: ltr` for English-primary display.

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
| UI | English-First Translation | COMPLETE (all components LTR, share/boards pages converted) |

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
npm run test          # Run tests (895 tests)
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
- [x] 895 tests passing
- [x] Production build succeeds

---

## Work Item Summary

| Priority | Count | Category |
|----------|-------|----------|
| **P0** | 0 | Critical blockers |
| **P1** | 0 | Important (all resolved) |
| **P2** | 1 | Post-MVP enhancements (P2.2, P2.4, P2.5, P2.8, Canvas RTL resolved) |
| **P3** | 4 | Future nice-to-haves |

### Quick Reference - Next Actions

1. **P2.3** - Test Coverage Expansion (hook tests for use-people.ts, use-boards.ts - LOW priority, blocked by vitest worker timeouts)

2. **P2.6** - Authentic Mantras (source 260 authentic mantras, translate to Hebrew - blocked on external content sourcing)

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
